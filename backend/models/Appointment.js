/**
 * backend/models/Appointment.js
 */
const db = require('./db');

const Appointment = {
    async getAvailableSlots(doctorId, date) {
        const { rows } = await db.query(
            `SELECT scheduled_at::time as appointment_time FROM appointments
             WHERE doctor_id = $1
               AND DATE(scheduled_at) = $2
               AND status IN ('confirmed', 'pending')
             ORDER BY scheduled_at`,
            [doctorId, date]
        );
        return rows.map(r => r.appointment_time);
    },
    async create(data) {
        const scheduled_at = `${data.appointment_date} ${data.appointment_time}`;
        const { rows } = await db.query(
            `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, appointment_type, notes, status)
             VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
            [data.patient_id, data.doctor_id, scheduled_at, data.appointment_type, data.notes]
        );
        return rows[0];
    },
    async findByPatient(patientId) {
        const { rows } = await db.query(
            `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.appointment_type, a.notes, a.status,
                    DATE(a.scheduled_at) as appointment_date, 
                    a.scheduled_at::time as appointment_time,
                    json_build_object('full_name', d.full_name, 'specialty', d.specialty, 'hospital_name', d.hospital_name) as doctors
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.patient_id = $1
             ORDER BY a.scheduled_at DESC`,
            [patientId]
        );
        return rows;
    },
    async findByDoctor(doctorId) {
        const { rows } = await db.query(
            `SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.appointment_type, a.notes, a.status,
                    DATE(a.scheduled_at) as appointment_date, 
                    a.scheduled_at::time as appointment_time,
                    p.full_name as patient_name
             FROM appointments a
             LEFT JOIN profiles p ON a.patient_id = p.id
             WHERE a.doctor_id = $1
             ORDER BY a.scheduled_at DESC`,
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
