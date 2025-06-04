const pool = require("../db");  // Database pool

// Function to get payment amounts for all activities with optional SP filter
async function getPaymentAmounts(req, res) {
  try {
    const { sp_id, activity_id, member_id, person_id } = req.query;
    
    let query = `
      SELECT 
        presence_id,
        id_activity,
        activity_description,
        activity_date,
        person_id,
        first_name,
        last_name,
        id_member,
        person_type,
        base_price,
        guests_brought,
        discount_threshold,
        gets_discount,
        discount_rate,
        amount_to_pay
      FROM mv_payment_amounts
    `;
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Add SP filter if provided - filter by persons belonging to a specific SP
    if (sp_id) {
      conditions.push(`person_id IN (SELECT id FROM Persons WHERE id_sp = $${paramIndex})`);
      params.push(parseInt(sp_id));
      paramIndex++;
    }

    // Add activity filter if provided
    if (activity_id) {
      conditions.push(`id_activity = $${paramIndex}`);
      params.push(parseInt(activity_id));
      paramIndex++;
    }

    // Add member filter if provided
    if (member_id) {
      conditions.push(`id_member = $${paramIndex}`);
      params.push(parseInt(member_id));
      paramIndex++;
    }

    // Add person filter if provided
    if (person_id) {
      conditions.push(`person_id = $${paramIndex}`);
      params.push(parseInt(person_id));
      paramIndex++;
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY activity_date DESC, id_activity, id_member, person_type DESC`;

    const result = await pool.query(query, params);
    
    res.status(200).json({
      total_records: result.rows.length,
      payments: result.rows
    });
  } catch (error) {
    console.error("Error fetching payment amounts:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getActivitySituation(req, res) {
  try {
    const { sp_id } = req.query;
    
    let spFilter = '';
    let params = [];
    
    if (sp_id) {
      spFilter = `WHERE pmt.person_id IN (SELECT id FROM Persons WHERE id_sp = $1)`;
      params.push(parseInt(sp_id));
    }

    const query = `
      SELECT 
        pmt.id_activity,
        pmt.activity_description,
        pmt.activity_date,
        pmt.total_participants,
        pmt.total_members,
        pmt.total_guests,
        pmt.avg_base_price,
        pmt.total_revenue,
        COALESCE(paid.total_paid, 0) as total_paid,
        (pmt.total_revenue - COALESCE(paid.total_paid, 0)) as remaining_balance
      FROM (
        SELECT 
          id_activity,
          activity_description,
          activity_date,
          COUNT(*) as total_participants,
          COUNT(CASE WHEN person_type = 'member' THEN 1 END) as total_members,
          COUNT(CASE WHEN person_type = 'guest' THEN 1 END) as total_guests,
          AVG(base_price) as avg_base_price,
          SUM(amount_to_pay) as total_revenue
        FROM mv_payment_amounts
        ${sp_id ? 'WHERE person_id IN (SELECT id FROM Persons WHERE id_sp = $1)' : ''}
        GROUP BY id_activity, activity_description, activity_date
      ) pmt
      LEFT JOIN (
  SELECT 
    ap.id_activity,
    SUM(ap.amount) as total_paid
  FROM ActivityPayment ap
  JOIN mv_payment_amounts pmt ON ap.id_presenceactivity = pmt.presence_id
  ${sp_id ? 'WHERE pmt.person_id IN (SELECT id FROM Persons WHERE id_sp = $1)' : ''}
  GROUP BY ap.id_activity
) paid ON pmt.id_activity = paid.id_activity
      ORDER BY pmt.activity_date DESC
    `;

    const result = await pool.query(query, params);
    
    // Calculate overall statistics
    const overallStats = {
      total_activities: result.rows.length,
      total_participants: result.rows.reduce((sum, row) => sum + parseInt(row.total_participants), 0),
      total_members: result.rows.reduce((sum, row) => sum + parseInt(row.total_members), 0),
      total_guests: result.rows.reduce((sum, row) => sum + parseInt(row.total_guests), 0),
      total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
      total_paid: result.rows.reduce((sum, row) => sum + parseFloat(row.total_paid || 0), 0),
      remaining_balance: result.rows.reduce((sum, row) => sum + parseFloat(row.remaining_balance || 0), 0)
    };

    // Query to get people who have paid in full
    const fullyPaidQuery = `
      SELECT DISTINCT
        pmt.person_id,
        pmt.first_name,
        pmt.last_name,
        pmt.person_type,
        sp.description as sp_description,
        sp.region as sp_region,
        COUNT(pmt.id_activity) as activities_count,
        SUM(pmt.amount_to_pay) as total_amount_to_pay,
        COALESCE(SUM(paid_amounts.amount_paid), 0) as total_amount_paid
      FROM mv_payment_amounts pmt
      JOIN Persons p ON pmt.person_id = p.id
      LEFT JOIN SP sp ON p.id_sp = sp.id
      LEFT JOIN (
        SELECT 
          ap.id_presenceactivity,
          SUM(ap.amount) as amount_paid
        FROM ActivityPayment ap
        GROUP BY ap.id_presenceactivity
      ) paid_amounts ON pmt.presence_id = paid_amounts.id_presenceactivity
      ${sp_id ? 'WHERE pmt.person_id IN (SELECT id FROM Persons WHERE id_sp = $1)' : ''}
      GROUP BY pmt.person_id, pmt.first_name, pmt.last_name, pmt.person_type, sp.description, sp.region
      HAVING SUM(pmt.amount_to_pay) <= COALESCE(SUM(paid_amounts.amount_paid), 0)
      ORDER BY pmt.person_type, pmt.last_name, pmt.first_name
    `;

    const fullyPaidResult = await pool.query(fullyPaidQuery, params);

    res.status(200).json({
      sp_filter: sp_id || 'all_sp',
      overall_statistics: overallStats,
      activities_detail: result.rows,
      fully_paid_persons: fullyPaidResult.rows
    });
  } catch (error) {
    console.error("Error fetching activity situation:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to get activity payment details
async function getActivityPaymentDetails(req, res) {
  try {
    const { activity_id } = req.params;
    
    const query = `
      SELECT 
        ap.id,
        ap.date as payment_date,
        ap.amount,
        pmt.person_id,
        pmt.first_name,
        pmt.last_name,
        pmt.person_type,
        pmt.amount_to_pay,
        (pmt.amount_to_pay - ap.amount) as remaining_for_person
      FROM ActivityPayment ap
      JOIN mv_payment_amounts pmt ON ap.id_presenceactivity = pmt.presence_id
      WHERE ap.id_activity = $1
      ORDER BY ap.date DESC, pmt.person_type, pmt.last_name
    `;
    
    const result = await pool.query(query, [activity_id]);
    
    // Calculate totals for this activity
    const totalsQuery = `
      SELECT 
        SUM(pmt.amount_to_pay) as total_expected,
        COALESCE(SUM(ap.amount), 0) as total_paid,
        (SUM(pmt.amount_to_pay) - COALESCE(SUM(ap.amount), 0)) as total_remaining
      FROM mv_payment_amounts pmt
      LEFT JOIN ActivityPayment ap ON pmt.presence_id = ap.id_presenceactivity
      WHERE pmt.id_activity = $1
    `;
    
    const totalsResult = await pool.query(totalsQuery, [activity_id]);
    
    res.status(200).json({
      activity_id: parseInt(activity_id),
      payment_summary: totalsResult.rows[0],
      payment_details: result.rows
    });
  } catch (error) {
    console.error("Error fetching activity payment details:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getPersonPaymentSummary(req, res) {
  try {
    const { sp_id, person_type } = req.query;
    
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Filter by SP if provided
    if (sp_id) {
      conditions.push(`person_id IN (SELECT id FROM Persons WHERE id_sp = $${paramIndex})`);
      params.push(parseInt(sp_id));
      paramIndex++;
    }

    if (person_type && ['member', 'guest'].includes(person_type)) {
      conditions.push(`person_type = $${paramIndex}`);
      params.push(person_type);
      paramIndex++;
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        person_id,
        first_name,
        last_name,
        person_type,
        COUNT(*) as nb_activities_attended,
        SUM(amount_to_pay) as total_amount_to_pay,
        AVG(amount_to_pay) as avg_amount_per_activity,
        COUNT(CASE WHEN gets_discount = true THEN 1 END) as activities_with_discount
      FROM mv_payment_amounts
      ${whereClause}
      GROUP BY person_id, first_name, last_name, person_type
      ORDER BY total_amount_to_pay DESC
    `;

    const result = await pool.query(query, params);
    
    res.status(200).json({
      sp_filter: sp_id || 'all_sp',
      person_type_filter: person_type || 'all_types',
      total_persons: result.rows.length,
      payment_summary: result.rows
    });
  } catch (error) {
    console.error("Error fetching person payment summary:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to refresh payment views
async function refreshPaymentViews(req, res) {
  try {
    await pool.query("SELECT refresh_all_payment_views()");
    
    res.status(200).json({
      message: "All payment views refreshed successfully"
    });
  } catch (error) {
    console.error("Error refreshing payment views:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { 
  getPaymentAmounts, 
  getActivitySituation, 
  getPersonPaymentSummary, 
  refreshPaymentViews,
  getActivityPaymentDetails
};