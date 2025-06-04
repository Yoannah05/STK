const pool = require("../db");
const { DiscountService } = require("../utils/discountService");
const { QueryHelpers } = require("../utils/queryHelpers");

const getAllPresences = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (
        COALESCE(ap.id_person, ap.id_member), 
        a.id
      )
        ap.id AS presence_id,
        p.first_name,
        p.last_name,
        a.description AS activity_description,
        a.price AS activity_price,
        a.date AS activity_date,
        ap.id_member,
        a.id AS activity_id,
        p.id AS person_id,
        CASE WHEN m.id IS NOT NULL THEN true ELSE false END AS is_member
      FROM ActivityPresence ap
      JOIN Persons p ON p.id = COALESCE(ap.id_person, ap.id_member)
      JOIN Activities a ON ap.id_activity = a.id
      LEFT JOIN Members m ON m.id_person = p.id
      ORDER BY COALESCE(ap.id_person, ap.id_member), a.id, ap.id DESC
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching presences:", error.message);
    res.status(500).json({ error: "Error fetching presences" });
  }
};

const getPresenceBalance = async (req, res) => {
  try {
    const { presence } = req.query;

    if (!presence) {
      return res.status(400).json({ error: "Presence ID is required" });
    }

    const presenceDetails = await QueryHelpers.getPresenceDetails(presence);
    if (!presenceDetails) {
      return res.status(404).json({ error: "Presence record not found" });
    }

    const { price, id_member, activity_id, person_id } = presenceDetails;
    const originalPrice = parseFloat(price);

    const priceInfo = await DiscountService.calculateDiscountedPrice(
      originalPrice, id_member, activity_id, person_id
    );
    
    const totalPaid = await QueryHelpers.getTotalPayments(presence);
    const remainingBalance = priceInfo.discountedPrice - totalPaid;

    res.status(200).json({ 
      remaining_balance: Number(remainingBalance),
      total_price: Number(priceInfo.discountedPrice),
      original_price: Number(originalPrice),
      total_paid: Number(totalPaid),
      discount_info: {
        has_discount: priceInfo.hasDiscount,
        discount_percentage: priceInfo.discount,
        people_brought: priceInfo.peopleBrought,
        minimum_required: priceInfo.minimumRequired,
        discount_amount: Number(originalPrice - priceInfo.discountedPrice),
        is_member: priceInfo.isMember
      }
    });
  } catch (error) {
    console.error("Error fetching presence balance:", error.message);
    res.status(500).json({ error: "Error fetching presence balance" });
  }
};

const insertActivityPayment = async (req, res) => {
  try {
    const { id_presenceactivity, amount } = req.body;

    if (!id_presenceactivity || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid payment data" });
    }

    const presenceDetails = await QueryHelpers.getPresenceDetails(id_presenceactivity);
    if (!presenceDetails) {
      return res.status(404).json({ error: "Presence record not found" });
    }

    const { price, id_member, activity_id, person_id } = presenceDetails;
    const originalPrice = parseFloat(price);

    const priceInfo = await DiscountService.calculateDiscountedPrice(
      originalPrice, id_member, activity_id, person_id
    );

    const totalPaid = await QueryHelpers.getTotalPayments(id_presenceactivity);
    const remainingAmount = priceInfo.discountedPrice - totalPaid;

    if (amount > remainingAmount) {
      return res.status(400).json({ 
        error: "Payment exceeds remaining balance",
        remaining_balance: remainingAmount,
        discount_applied: priceInfo.hasDiscount
      });
    }

    const insertQuery = `
      INSERT INTO ActivityPayment (date, id_activity, id_presenceactivity, amount) 
      SELECT CURRENT_DATE, ap.id_activity, ap.id, $2
      FROM ActivityPresence ap
      WHERE ap.id = $1
      RETURNING id, date, id_activity, id_presenceactivity, amount;
    `;

    const result = await pool.query(insertQuery, [id_presenceactivity, amount]);

    res.status(201).json({
      message: "Payment successful",
      payment: result.rows[0],
      discount_applied: priceInfo.hasDiscount,
      discount_info: priceInfo.hasDiscount ? {
        original_price: originalPrice,
        discounted_price: priceInfo.discountedPrice,
        discount_percentage: priceInfo.discount,
        people_brought: priceInfo.peopleBrought
      } : null
    });
  } catch (error) {
    console.error("Error inserting payment:", error.message);
    res.status(500).json({ error: "Error inserting payment" });
  }
};

module.exports = { 
  getAllPresences, 
  getPresenceBalance, 
  insertActivityPayment 
};
