/**
 * backend/controllers/appointmentController.js
 */
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

async function getSlots(req, res, next) {
    try {
        const { doctorId, date } = req.query;
        const slots = await Appointment.getAvailableSlots(doctorId, date);
        res.json({ slots });
    } catch (err) { next(err); }
}

async function book(req, res, next) {
    try {
        const { doctorId, scheduledAt, type, notes } = req.body;
        const patientId = req.user.id;

        // Verify doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        const appointment = await Appointment.create({
            patient_id: patientId,
            doctor_id: doctorId,
            scheduled_at: scheduledAt,
            type,
            notes,
        });

        res.status(201).json({ appointment });
    } catch (err) { next(err); }
}

async function getMyAppointments(req, res, next) {
    try {
        const list = await Appointment.findByPatient(req.user.id);
        res.json({ appointments: list });
    } catch (err) { next(err); }
}

async function cancel(req, res, next) {
    try {
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (appt.patient_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        await Appointment.cancel(req.params.id);
        res.json({ message: 'Appointment cancelled' });
    } catch (err) { next(err); }
}

module.exports = { getSlots, book, getMyAppointments, cancel };
