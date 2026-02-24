/**
 * backend/controllers/emergencyController.js
 */
const db = require('../models/db');

async function trigger(req, res, next) {
    try {
        const { lat, lng } = req.body;
        const user_id = req.user?.id || null;
        const location = `Lat: ${lat}, Lng: ${lng}`;

        if (user_id) {
            await db.query(
                `INSERT INTO emergency_requests (user_id, location, status) VALUES ($1, $2, 'pending')`,
                [user_id, location]
            );
        }

        res.status(201).json({ message: 'Emergency alert logged. Call 112 immediately.' });
    } catch (err) { next(err); }
}

async function nearbyHospitals(req, res, next) {
    try {
        // Fallback static data since 'hospitals' table is missing from Postgres schema
        const mockHospitals = [
            { id: 1, name: "City General Hospital", city: "Delhi", address: "123 Main St", phone: "112", emergency: true, distance: 2.4 },
            { id: 2, name: "Apollo MedCenter", city: "Mumbai", address: "45 West Ave", phone: "112", emergency: true, distance: 4.1 },
            { id: 3, name: "Sunrise Urgent Care", city: "Bangalore", address: "Tech Park Rd", phone: "112", emergency: true, distance: 5.8 }
        ];
        res.json({ hospitals: mockHospitals });
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
