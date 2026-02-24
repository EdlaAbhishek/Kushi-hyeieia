/**
 * backend/models/Doctor.js
 */
const db = require('./db');

const Doctor = {
    async search(specialty) {
        const base = `
            SELECT id, specialty, full_name, hospital_name as hospital, available as verified
            FROM doctors
            WHERE available = TRUE AND full_name IS NOT NULL
        `;
        if (specialty) {
            const { rows } = await db.query(base + ' AND specialty ILIKE $1 ORDER BY full_name', [`%${specialty}%`]);
            return rows;
        }
        const { rows } = await db.query(base + ' ORDER BY full_name');
        return rows;
    },
    async findById(id) {
        const { rows } = await db.query(
            `SELECT id, specialty, full_name, hospital_name as hospital, available as verified
             FROM doctors
             WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
    },
    async findByUserId(userId) {
        // In the current schema, the doctor's 'id' IS the user_id from auth.
        const { rows } = await db.query('SELECT * FROM doctors WHERE id = $1', [userId]);
        return rows[0] || null;
    },
    async create({ id, specialty, hospital_name, full_name, bio }) {
        const { rows } = await db.query(
            `INSERT INTO doctors (id, specialty, hospital_name, full_name, bio, available)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
            [id, specialty, hospital_name, full_name, bio]
        );
        return rows[0];
    },
};

module.exports = Doctor;
