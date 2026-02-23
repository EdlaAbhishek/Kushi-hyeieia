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
        const { doctor_id, appointment_date, appointment_time } = req.body;
        const patient_id = req.user.id;

        const appointment = await Appointment.create({
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            appointment_type: 'in-person',
            notes: '',
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

async function getDoctorAppointments(req, res, next) {
    try {
        const list = await Appointment.findByDoctor(req.user.id);
        res.json({ appointments: list });
    } catch (err) { next(err); }
}

async function updateAppointment(req, res, next) {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (status) await Appointment.updateStatus(id, status);
        if (notes !== undefined) await Appointment.updateNotes(id, notes);

        res.json({ message: 'Appointment updated' });
    } catch (err) { next(err); }
}

async function cancel(req, res, next) {
    try {
        const appt = await Appointment.findById(req.params.id);
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });
        if (appt.patient_id !== req.user.id && appt.doctor_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await Appointment.cancel(req.params.id);
        res.json({ message: 'Appointment cancelled' });
    } catch (err) { next(err); }
}

module.exports = { getSlots, book, getMyAppointments, getDoctorAppointments, updateAppointment, cancel };
