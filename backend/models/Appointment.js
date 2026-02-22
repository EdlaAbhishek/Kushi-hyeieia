/**
 * backend/models/Appointment.js
 */
const db = require('./db');

const Appointment = {
    async getAvailableSlots(doctorId, date) {
        const { rows } = await db.query(
            `SELECT scheduled_at FROM appointments
             WHERE doctor_id = $1
               AND DATE(scheduled_at) = $2
               AND status IN ('confirmed', 'pending')
             ORDER BY scheduled_at`,
            [doctorId, date]
        );
        return rows.map(r => r.scheduled_at);
    },
    async create(data) {
        const { rows } = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, type, notes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [data.patient_id, data.doctor_id, data.scheduled_at, data.type, data.notes]
        );
        return rows[0];
    },
    async findByPatient(patientId) {
        const { rows } = await db.query(
            `SELECT a.*, d.specialty, u.full_name AS doctor_name
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users   u ON d.user_id   = u.id
             WHERE a.patient_id = $1
             ORDER BY a.scheduled_at DESC`,
            [patientId]
        );
        return rows;
    },
    async findById(id) {
        const { rows } = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
        return rows[0] || null;
    },
    async cancel(id) {
        await db.query(`UPDATE appointments SET status = 'cancelled' WHERE id = $1`, [id]);
    },
};

module.exports = Appointment;
