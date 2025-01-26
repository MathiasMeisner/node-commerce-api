const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const isTestEnv = process.env.NODE_ENV === "test";

const pool = isTestEnv
    ? { query: jest.fn() } // Mock database for tests
    : new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
    });

if (!isTestEnv) {
    pool.connect()
        .then(() => console.log("Connected to PostgreSQL"))
        .catch((err) => console.error("Database connection error:", err));
}

module.exports = pool;

