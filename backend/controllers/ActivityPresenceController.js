// controllers/ActivityPresenceController.js
const pool = require("../db"); // Database pool

// Function to fetch all members
async function getMembers(req, res) {
  try {
    const { rows: members } = await pool.query(
      `SELECT m.id, p.first_name, p.last_name 
       FROM Members m
       JOIN Persons p ON m.id_person = p.id`
    );
    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching members:", error.message);
    res.status(500).json({ error: "Error fetching members" });
  }
}

async function getPersons(req, res) {
    try {
      // SQL query to fetch persons not in the Members table
      const { rows: persons } = await pool.query(
        `SELECT p.id, p.first_name, p.last_name 
         FROM Persons p
         LEFT JOIN Members m ON p.id = m.id_person
         WHERE m.id IS NULL`
      );
      
      res.status(200).json(persons); // Send the fetched persons as the response
    } catch (error) {
      console.error("Error fetching persons:", error.message);
      res.status(500).json({ error: "Error fetching persons" });
    }
  }
   

// Function to fetch all activities
async function getActivities(req, res) {
  try {
    const { rows: activities } = await pool.query(
      "SELECT id, description AS name, date FROM Activities"
    );
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error.message);
    res.status(500).json({ error: "Error fetching activities" });
  }
}

async function insertActivityPresence(req, res) {
  try {
    let { id_member, id_person, id_activity } = req.body;

    // Convert empty strings to null
    id_member = id_member === '' ? null : id_member;
    id_person = id_person === '' ? null : id_person;

    // Validate required fields
    if (!id_activity) {
      return res.status(400).json({ error: "Activity ID is required." });
    }

    // Ensure at least one of member or person is provided
    if (id_member === null && id_person === null) {
      return res.status(400).json({ error: "Either member or person must be specified." });
    }

    // Check for existing presence records
    if (id_person !== null) {
      const { rows: existingPersonPresence } = await pool.query(
        "SELECT * FROM ActivityPresence WHERE id_person = $1 AND id_activity = $2",
        [id_person, id_activity]
      );
      
      if (existingPersonPresence.length > 0) {
        return res.status(400).json({ error: "Person has already attended this activity." });
      }
    }

    if (id_member !== null) {
      const { rows: existingMemberPresence } = await pool.query(
        "SELECT * FROM ActivityPresence WHERE id_member = $1 AND id_activity = $2",
        [id_member, id_activity]
      );
      
      if (existingMemberPresence.length > 0) {
        return res.status(400).json({ error: "Member has already attended this activity." });
      }
    }

    // Insert the new presence record
    const insertQuery = ` 
      INSERT INTO ActivityPresence (id_member, id_person, id_activity) 
      VALUES ($1, $2, $3) 
      RETURNING id, id_member, id_person, id_activity;
    `;
    
    const result = await pool.query(insertQuery, [
      id_member,
      id_person,
      id_activity
    ]);

    res.status(201).json({
      message: "Activity presence added successfully!",
      activityPresence: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting activity presence:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
  

module.exports = { getMembers, getPersons, getActivities, insertActivityPresence };
