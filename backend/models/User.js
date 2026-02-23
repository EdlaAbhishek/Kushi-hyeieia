/**
 * backend/models/User.js
 */
const db = require('./db');

const User = {
    async findByEmail(email) {
        const { rows } = await db.query('SELECT * FROM profiles WHERE email = $1', [email]);
        return rows[0] || null;
    },
    async create({ full_name, email, password_hash, role }) {
        const { rows } = await db.query(
            `INSERT INTO profiles (full_name, email, password_hash, role)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [full_name, email, password_hash, role]
        );
        return rows[0];
    },
    async findById(id) {
        const { rows } = await db.query('SELECT * FROM profiles WHERE id = $1', [id]);
        return rows[0] || null;
    },
};

module.exports = User;
