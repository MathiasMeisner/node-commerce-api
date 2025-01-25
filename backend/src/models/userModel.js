const pool = require("../config/dbConfig");

const getUsers = async () => {
    try {
        const result = await pool.query("SELECT * FROM users");
        return result.rows;
    } catch (err) {
        console.error("Error fetching users:", err);
        throw err;
    }
};

module.exports = { getUsers };