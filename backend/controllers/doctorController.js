/**
 * backend/controllers/doctorController.js
 */
const Doctor = require('../models/Doctor');

async function search(req, res, next) {
    try {
        const { specialty } = req.query;
        const doctors = await Doctor.search(specialty);
        res.json({ doctors });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
        res.json({ doctor });
    } catch (err) { next(err); }
}

async function register(req, res, next) {
    try {
        const { specialty, registration_no, bio } = req.body;
        const user_id = req.user.id;

        const existing = await Doctor.findByUserId(user_id);
        if (existing) return res.status(409).json({ error: 'Doctor profile already exists' });

        const doctor = await Doctor.create({ user_id, specialty, registration_no, bio });
        res.status(201).json({ doctor });
    } catch (err) { next(err); }
}

module.exports = { search, getById, register };
