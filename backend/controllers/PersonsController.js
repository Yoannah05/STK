const pool = require("../db");  // Database pool

// Function to insert a new person
async function insertPerson(req, res) {
  try {
    const { first_name, last_name, birth_date, id_sp } = req.body;

    // Ensure the SP exists before inserting
    const { rows } = await pool.query("SELECT id FROM SP WHERE id = $1", [id_sp]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "SP not found." });
    }

    // Insert the person into the Persons table
    const insertPersonQuery = `
      INSERT INTO Persons (first_name, last_name, birth_date, id_sp)
      VALUES ($1, $2, $3, $4)
      RETURNING id, first_name, last_name, birth_date, id_sp;
    `;
    const result = await pool.query(insertPersonQuery, [first_name, last_name, birth_date, id_sp]);

    res.status(201).json({
      message: "Person added successfully!",
      person: result.rows[0]
    });
  } catch (error) {
    console.error("Error inserting person:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to insert a new member (which extends a person)
async function insertMember(req, res) {
  try {
    const { person_id, affiliation_date } = req.body;

    // Check if the person exists in the Persons table
    const { rows } = await pool.query("SELECT id FROM Persons WHERE id = $1", [person_id]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "Person not found." });
    }

    // Insert the member into the Members table
    const insertMemberQuery = `
      INSERT INTO Members (id, affiliation_date)
      VALUES ($1, $2)
      RETURNING id, affiliation_date;
    `;
    const result = await pool.query(insertMemberQuery, [person_id, affiliation_date]);

    res.status(201).json({
      message: "Member added successfully!",
      member: result.rows[0]
    });
  } catch (error) {
    console.error("Error inserting member:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to fetch all persons
async function getPersons(req, res) {
  try {
    const result = await pool.query("SELECT id, first_name, last_name FROM Persons");  // Query to get all persons
    res.status(200).json(result.rows);  // Send the persons as a JSON response
  } catch (error) {
    console.error("Error fetching persons:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Function to fetch all SPs
async function getSPs(req, res) {
  try {
    const result = await pool.query("SELECT * FROM SP");  // Query to get all SPs
    res.status(200).json(result.rows);  // Send the SPs as a JSON response
  } catch (error) {
    console.error("Error fetching SPs:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { insertPerson, insertMember, getPersons, getSPs };
