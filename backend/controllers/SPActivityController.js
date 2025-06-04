// controllers/SPActivityController.js
const pool = require("../db");
const { PriceCalculator } = require("../utils/priceCalculator");

const getSPActivityStates = async (req, res) => {
  const { region } = req.query;

  try {
    const basicResult = await getSPActivityBasicData(region);
    const processedResults = [];
    
    for (const row of basicResult.rows) {
      if (row.person_count > 0) {
        const presences = await getSPActivityPresences(row.sp_id, row.activity_id);
        const totalExpectedPrice = await PriceCalculator.calculateTotalExpectedPrice(
          presences, 
          parseFloat(row.activity_price)
        );
        
        const remainingBalance = totalExpectedPrice - parseFloat(row.total_paid);
        
        const result = {
          sp_id: row.sp_id,
          sp_region: row.sp_region,
          sp_desc: row.sp_desc,
          activity_id: row.activity_id,
          activity_description: row.activity_description,
          activity_date: row.activity_date,
          person_count: parseInt(row.person_count),
          total_price: totalExpectedPrice,
          total_paid: parseFloat(row.total_paid),
          remaining_balance: remainingBalance
        };

        processedResults.push(PriceCalculator.formatFinancialResult(result));
      } else {
        processedResults.push({
          sp_id: row.sp_id,
          sp_region: row.sp_region,
          sp_desc: row.sp_desc,
          activity_id: row.activity_id,
          activity_description: row.activity_description,
          activity_date: row.activity_date,
          person_count: 0,
          total_price: 0,
          total_paid: Number(row.total_paid),
          remaining_balance: -Number(row.total_paid)
        });
      }
    }

    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching SP activity states:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSPActivityBasicData = async (region) => {
  const query = `
    WITH 
    sp_activity_presence AS (
      SELECT 
        p.id_sp,
        ap.id_activity,
        COUNT(DISTINCT p.id) AS unique_person_count
      FROM ActivityPresence ap
      LEFT JOIN Members m ON ap.id_member = m.id
      LEFT JOIN Persons p ON (ap.id_person = p.id OR m.id_person = p.id)
      WHERE p.id IS NOT NULL
      GROUP BY p.id_sp, ap.id_activity
    ),
    sp_activity_payments AS (
      SELECT 
        p.id_sp,
        app.id_activity,
        COALESCE(SUM(ap.amount), 0) AS total_paid
      FROM ActivityPayment ap
      JOIN ActivityPresence app ON ap.id_presenceactivity = app.id
      LEFT JOIN Members m ON app.id_member = m.id
      LEFT JOIN Persons p ON (app.id_person = p.id OR m.id_person = p.id)
      WHERE p.id IS NOT NULL
      GROUP BY p.id_sp, app.id_activity
    )
    SELECT 
      sp.id AS sp_id,
      sp.region AS sp_region,
      sp.description as sp_desc,
      a.id AS activity_id,
      a.description AS activity_description,
      a.date AS activity_date,
      a.price AS activity_price,
      COALESCE(sap.unique_person_count, 0) AS person_count,
      COALESCE(sapm.total_paid, 0) AS total_paid
    FROM SP sp
    CROSS JOIN Activities a
    LEFT JOIN sp_activity_presence sap ON sp.id = sap.id_sp AND a.id = sap.id_activity
    LEFT JOIN sp_activity_payments sapm ON sp.id = sapm.id_sp AND a.id = sapm.id_activity
    ${region ? "WHERE sp.region = $1" : ""}
    ORDER BY sp.description, a.date DESC
  `;

  const values = region ? [region] : [];
  return pool.query(query, values);
};

const getSPActivityPresences = async (spId, activityId) => {
  const { rows } = await pool.query(
    `SELECT 
      ap.id_member,
      ap.id_activity,
      COALESCE(ap.id_person, m.id_person) as person_id
    FROM ActivityPresence ap
    LEFT JOIN Members m ON ap.id_member = m.id
    LEFT JOIN Persons p ON (ap.id_person = p.id OR m.id_person = p.id)
    WHERE p.id_sp = $1 AND ap.id_activity = $2`,
    [spId, activityId]
  );
  return rows;
};

module.exports = { getSPActivityStates };