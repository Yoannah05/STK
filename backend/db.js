const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "stk",
  password: "pass",
  port: 5432,
});

module.exports = pool;
