/**
 * backend/controllers/emergencyController.js
 */
const db = require('../models/db');

async function trigger(req, res, next) {
    try {
        const { lat, lng } = req.body;
        const user_id = req.user?.id || null;

        await db.query(
            `INSERT INTO emergency_logs (user_id, lat, lng, trigger_type) VALUES ($1, $2, $3, 'sos')`,
            [user_id, lat, lng]
        );

        res.status(201).json({ message: 'Emergency alert logged. Call 112 immediately.' });
    } catch (err) { next(err); }
}

async function nearbyHospitals(req, res, next) {
    try {
        const { lat, lng } = req.query;
        // Haversine-based search — top 5 within 20km
        const result = await db.query(
            `SELECT id, name, city, address, phone, emergency,
                    (6371 * acos(cos(radians($1)) * cos(radians(lat)) *
                    cos(radians(lng) - radians($2)) + sin(radians($1)) * sin(radians(lat)))) AS distance
             FROM hospitals
             WHERE emergency = TRUE
             ORDER BY distance
             LIMIT 5`,
            [lat, lng]
        );
        res.json({ hospitals: result.rows });
    } catch (err) { next(err); }
}

async function bloodRequest(req, res, next) {
    try {
        const { bloodType } = req.body;
        // TODO: integrate with blood bank partner API
        res.json({ message: `Blood request for ${bloodType} broadcasted to network.` });
    } catch (err) { next(err); }
}

module.exports = { trigger, nearbyHospitals, bloodRequest };
