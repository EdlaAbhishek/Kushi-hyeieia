/**
 * backend/models/Appointment.js
 */
const db = require('./db');

const Appointment = {
    async getAvailableSlots(doctorId, date) {
        const { rows } = await db.query(
            `SELECT appointment_time FROM appointments
             WHERE doctor_id = $1
               AND appointment_date = $2
               AND status IN ('confirmed', 'pending')
             ORDER BY appointment_time`,
            [doctorId, date]
        );
        return rows.map(r => r.appointment_time);
    },
    async create(data) {
        const { rows } = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, appointment_type, notes, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
            [data.patient_id, data.doctor_id, data.appointment_date, data.appointment_time, data.appointment_type, data.notes]
        );
        return rows[0];
    },
    async findByPatient(patientId) {
        const { rows } = await db.query(
            `SELECT a.*,
                    json_build_object('full_name', d.full_name, 'specialty', d.specialty, 'hospital_name', d.hospital_name) as doctors
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.patient_id = $1
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [patientId]
        );
        return rows;
    },
    async findByDoctor(doctorId) {
        const { rows } = await db.query(
            `SELECT a.*, p.full_name as patient_name
             FROM appointments a
             LEFT JOIN profiles p ON a.patient_id = p.id
             WHERE a.doctor_id = $1
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [doctorId]
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
    async updateStatus(id, status) {
        await db.query(`UPDATE appointments SET status = $1 WHERE id = $2`, [status, id]);
    },
    async updateNotes(id, notes) {
        await db.query(`UPDATE appointments SET notes = $1 WHERE id = $2`, [notes, id]);
    }
};

module.exports = Appointment;
