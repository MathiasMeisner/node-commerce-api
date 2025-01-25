const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

console.log("Connecting to Database:", {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Try connecting
pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("Database connection error:", err));

module.exports = pool;
