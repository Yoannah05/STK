
const pool = require("../db");
const { DiscountService } = require("../utils/discountService");
const { PriceCalculator } = require("../utils/priceCalculator");
const { calculateMemberAmountDue } = require("./MemberStateController");

const getMemberWithPersonsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Both startDate and endDate parameters are required" });
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
      const [memberPresences, personsPresences, memberPaid, personsPaid] = await Promise.all([
        getMemberOwnPresences(member.member_id, startDate, endDate),
        getPersonsPresences(member.member_id, startDate, endDate),
        getMemberOwnPayments(member.member_id, startDate, endDate),
        getPersonsPayments(member.member_id, startDate, endDate)
      ]);

      const memberAmountDue = await calculateMemberAmountDue(memberPresences, member.person_id);
      const personsAmountDue = calculatePersonsAmountDue(personsPresences);
      const uniquePersons = getUniquePersonsCount(personsPresences);

      const totalAmountDue = memberAmountDue + personsAmountDue;
      const totalPaid = memberPaid + personsPaid;
      const remainingBalance = totalAmountDue - totalPaid;

      const result = {
        member_id: member.member_id,
        first_name: member.first_name,
        last_name: member.last_name,
        member_activities: memberPresences.length,
        persons_brought: uniquePersons,
        total_amount_due: totalAmountDue,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      };

      processedResults.push(PriceCalculator.formatFinancialResult(result));
    }
    
    res.json(processedResults);
  } catch (error) {
    console.error("Error fetching member with persons report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getMemberOwnPresences = async (memberId, startDate, endDate) => {
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

const getPersonsPresences = async (memberId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT 
      ap.id_member,
      ap.id_activity,
      ap.id_person,
      a.price AS activity_price
    FROM ActivityPresence ap
    JOIN Activities a ON ap.id_activity = a.id
    WHERE a.date BETWEEN $1 AND $2
    AND ap.id_member = $3
    AND ap.id_person IS NOT NULL`,
    [startDate, endDate, memberId]
  );
  return rows;
};

const getMemberOwnPayments = async (memberId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(ap.amount), 0) AS member_paid
    FROM ActivityPayment ap
    JOIN ActivityPresence app ON ap.id_presenceactivity = app.id
    JOIN Activities a ON app.id_activity = a.id
    WHERE a.date BETWEEN $1 AND $2
    AND app.id_member = $3
    AND app.id_person IS NULL`,
    [startDate, endDate, memberId]
  );
  return parseFloat(rows[0].member_paid) || 0;
};

const getPersonsPayments = async (memberId, startDate, endDate) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(ap.amount), 0) AS persons_paid
    FROM ActivityPayment ap
    JOIN ActivityPresence app ON ap.id_presenceactivity = app.id
    JOIN Activities a ON app.id_activity = a.id
    WHERE a.date BETWEEN $1 AND $2
    AND app.id_member = $3
    AND app.id_person IS NOT NULL`,
    [startDate, endDate, memberId]
  );
  return parseFloat(rows[0].persons_paid) || 0;
};

const calculatePersonsAmountDue = (personsPresences) => {
  return personsPresences.reduce((total, presence) => {
    return total + parseFloat(presence.activity_price);
  }, 0);
};

const getUniquePersonsCount = (personsPresences) => {
  const uniquePersons = new Set();
  personsPresences.forEach(presence => {
    uniquePersons.add(presence.id_person);
  });
  return uniquePersons.size;
};

module.exports = { getMemberWithPersonsReport };

