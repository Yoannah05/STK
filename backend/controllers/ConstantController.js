// controllers/ConstantController.js
const pool = require("../db");

const getConstant = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Constant LIMIT 1");
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No constant data found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching constant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateConstant = async (req, res) => {
  const { remise, nbpersonne } = req.body;

  if (remise === undefined || nbpersonne === undefined) {
    return res.status(400).json({ error: "remise and nbpersonne are required" });
  }

  try {
    const query = `
      UPDATE Constant
      SET remise = $1, nbpersonne = $2
      RETURNING *;
    `;
    const result = await pool.query(query, [remise, nbpersonne]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No constant found to update" });
    }

    res.json({ message: "Constant updated successfully", constant: result.rows[0] });
  } catch (error) {
    console.error("Error updating constant:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getConstant, updateConstant };
