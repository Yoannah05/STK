const pool = require("../db");
const { DiscountService } = require("../utils/discountService");
const { PriceCalculator } = require("../utils/priceCalculator");

const getMemberStates = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    // Set defaults
    if (!startDate) startDate = '2025-04-01';
    if (!endDate) {
      const today = new Date();
      endDate = today.toISOString().split('T')[0];
    }

    const membersQuery = `
      SELECT 
        m.id AS member_id,
        p.first_name,
        p.last_name,
        p.id AS person_id
      FROM Members m
      JOIN Persons p ON m.id_person = p.id
      ORDER BY p.last_name, p.first_name
    `;

    const membersResult = await pool.query(membersQuery);
    const processedResults = [];

    for (const member of membersResult.rows) {
      const [presences, totalPaid] = await Promise.all([
        getMemberPresences(member.member_id, startDate, endDate),
        getMemberPayments(member.member_id, startDate, endDate)
      ]);

      const totalAmountDue = await calculateMemberAmountDue(presences, member.person_id);
      const remainingBalance = totalAmountDue - totalPaid;

      const result = {
        member_id: member.member_id,
        first_name: member.first_name,
        last_name: member.last_name,
        activity_count: presences.length,
        total_amount_due: totalAmountDue,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      };

      processedResults.push(PriceCalculator.formatFinancialResult(result));
    }

    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching member states:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMemberPresences = async (memberId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT 
      ap.id_member,
      ap.id_activity,
      a.price AS activity_price
    FROM ActivityPresence ap
    JOIN Activities a ON ap.id_activity = a.id
    WHERE a.date BETWEEN $1 AND $2
    AND ap.id_member = $3
    AND ap.id_person IS NULL`,
    [startDate, endDate, memberId]
  );
  return rows;
};

const getMemberPayments = async (memberId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(ap.amount), 0) AS total_paid
    FROM ActivityPayment ap
    JOIN ActivityPresence app ON ap.id_presenceactivity = app.id
    JOIN Activities a ON app.id_activity = a.id
    WHERE a.date BETWEEN $1 AND $2
    AND app.id_member = $3
    AND app.id_person IS NULL`,
    [startDate, endDate, memberId]
  );
  return parseFloat(rows[0].total_paid) || 0;
};

const calculateMemberAmountDue = async (presences, personId) => {
  let total = 0;
  for (const presence of presences) {
    const actualPrice = await DiscountService.calculateActualPrice(
      parseFloat(presence.activity_price),
      presence.id_member,
      presence.id_activity,
      personId
    );
    total += actualPrice;
  }
  return total;
};

module.exports = { getMemberStates, calculateMemberAmountDue };

