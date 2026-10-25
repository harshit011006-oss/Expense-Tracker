
require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is missing from .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
});

module.exports = pool;

// Run this test only when executing: node db.js
if (require.main === module) {
    console.log("Testing database connection...");

    pool.query("SELECT NOW() AS current_time")
        .then((result) => {
            console.log("Database connected successfully!");
            console.log("Database time:", result.rows[0].current_time);
        })
        .catch((error) => {
            console.error("Database connection failed:", error.message);
        })
        .finally(() => pool.end());
}
