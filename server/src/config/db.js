const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  // Keeping this as a runtime guard instead of failing import-time in tests.
  console.warn("DATABASE_URL is not set. Database calls will fail until it is.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};

