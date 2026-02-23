/**
 * backend/models/Doctor.js
 */
const db = require('./db');

const Doctor = {
    async search(specialty) {
        const base = `
            SELECT d.id, d.specialty, d.bio, d.verified,
                   u.full_name, h.name AS hospital_name, h.city
            FROM doctors d
            JOIN profiles u ON d.user_id = u.id
            LEFT JOIN hospitals h ON d.hospital_id = h.id
            WHERE d.verified = TRUE
        `;
        if (specialty) {
            const { rows } = await db.query(base + ' AND d.specialty ILIKE $1 ORDER BY u.full_name', [`%${specialty}%`]);
            return rows;
        }
        const { rows } = await db.query(base + ' ORDER BY u.full_name');
        return rows;
    },
    async findById(id) {
        const { rows } = await db.query(
            `SELECT d.*, u.full_name, u.email, h.name AS hospital_name
             FROM doctors d
             JOIN profiles u ON d.user_id = u.id
             LEFT JOIN hospitals h ON d.hospital_id = h.id
             WHERE d.id = $1`,
            [id]
        );
        return rows[0] || null;
    },
    async findByUserId(userId) {
        const { rows } = await db.query('SELECT * FROM doctors WHERE user_id = $1', [userId]);
        return rows[0] || null;
    },
    async create({ user_id, specialty, registration_no, bio }) {
        const { rows } = await db.query(
            `INSERT INTO doctors (user_id, specialty, registration_no, bio)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, specialty, registration_no, bio]
        );
        return rows[0];
    },
};

module.exports = Doctor;
