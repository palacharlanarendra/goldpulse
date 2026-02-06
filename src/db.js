// src/db.js
// Database connection module
// Manages the connection pool to PostgreSQL using 'pg' library.

require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance using the connection string from environment variables
// SSL is enabled with 'rejectUnauthorized: false' for Render compatibility
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = {
  // Export a query function that enables connection logging or debugging if needed in future
  // This allows executing SQL queries directly against the pool
  query: (text, params) => pool.query(text, params),
};
