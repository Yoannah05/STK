// utils/queryHelpers.js
const pool = require("../db");

class QueryHelpers {
  static async getPresenceDetails(presenceId) {
    const { rows } = await pool.query(
      `SELECT a.price, ap.id_member, a.id as activity_id, 
              COALESCE(ap.id_person, ap.id_member) as person_id
       FROM ActivityPresence ap
       JOIN Activities a ON ap.id_activity = a.id
       WHERE ap.id = $1`,
      [presenceId]
    );
    return rows[0] || null;
  }

  static async getTotalPayments(presenceId) {
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM ActivityPayment
       WHERE id_presenceactivity = $1`,
      [presenceId]
    );
    return parseFloat(rows[0].total_paid) || 0;
  }

  static async getActivitiesWithBasicCounts() {
    return pool.query(`
      WITH 
      member_presence AS (
        SELECT 
          ap.id_activity,
          COUNT(DISTINCT ap.id_member) AS unique_member_count
        FROM ActivityPresence ap
        WHERE ap.id_person IS NULL
        GROUP BY ap.id_activity
      ),
      non_member_presence AS (
        SELECT 
          ap.id_activity,
          COUNT(DISTINCT ap.id_person) AS unique_non_member_count
        FROM ActivityPresence ap
        WHERE ap.id_person IS NOT NULL
        GROUP BY ap.id_activity
      ),
      activity_payments AS (
        SELECT 
          ap_outer.id_activity,
          COALESCE(SUM(apm.amount), 0) AS total_paid
        FROM ActivityPresence ap_outer
        LEFT JOIN ActivityPayment apm ON ap_outer.id = apm.id_presenceactivity
        GROUP BY ap_outer.id_activity
      )
      SELECT 
        a.id AS activity_id,
        a.description,
        a.date,
        a.price,
        COALESCE(mp.unique_member_count, 0) AS member_count,
        COALESCE(nmp.unique_non_member_count, 0) AS non_member_count,
        COALESCE(ap.total_paid, 0) AS total_paid
      FROM Activities a
      LEFT JOIN member_presence mp ON a.id = mp.id_activity
      LEFT JOIN non_member_presence nmp ON a.id = nmp.id_activity
      LEFT JOIN activity_payments ap ON a.id = ap.id_activity
      ORDER BY a.date DESC
    `);
  }

  static async getActivityPresences(activityId) {
    const { rows } = await pool.query(
      `SELECT 
        ap.id_member,
        ap.id_activity,
        COALESCE(ap.id_person, ap.id_member) as person_id
      FROM ActivityPresence ap
      WHERE ap.id_activity = $1`,
      [activityId]
    );
    return rows;
  }
}

module.exports = { QueryHelpers };