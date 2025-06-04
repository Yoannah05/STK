const pool = require("../db");

// Function to get price constraints from `Constant` table
async function getPriceConstraints() {
  try {
    const { rows } = await pool.query("SELECT minimum_price, maximum_price FROM Constant LIMIT 1");
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error fetching price constraints:", error.message);
    throw error;
  }
}

// Function to insert a new activity with validation
async function insertActivity(req, res) {
  try {
    const { date, description, priority, region, price } = req.body;
    const activityDate = new Date(date);
    const today = new Date();

    // Check if date is in the future
    if (activityDate <= today) {
      return res.status(400).json({ error: "Date must be in the future." });
    }

    // Validate priority (must be between 1 and 10)
    if (priority < 1 || priority > 10) {
      return res.status(400).json({ error: "Priority must be between 1 and 10." });
    }

    // Fetch price constraints
    const constraints = await getPriceConstraints();
    if (!constraints) {
      return res.status(500).json({ error: "Price constraints not found." });
    }

    const { minimum_price, maximum_price } = constraints;
    if (price < minimum_price || price > maximum_price) {
      return res.status(400).json({
        error: `Price must be between ${minimum_price} and ${maximum_price}.`,
      });
    }

    // Insert activity into the database
    const insertQuery = `
      INSERT INTO Activities (date, description, priority, region, price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [date, description, priority, region, price]);

    res.status(201).json({ message: "Activity added successfully!", activity: rows[0] });
  } catch (error) {
    console.error("Error inserting activity:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { insertActivity };
