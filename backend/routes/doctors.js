/**
 * backend/routes/doctors.js
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, specialty, hospital_name as hospital, full_name, available as verified
            FROM doctors
            WHERE full_name IS NOT NULL
            ORDER BY full_name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server configuration error' });
    }
});

router.post('/register', authenticate, async (req, res) => {
    try {
        const { specialty, hospital_name, bio } = req.body;
        const user_id = req.user.id;
        const full_name = req.user?.user_metadata?.full_name || 'Dr. Unknown';

        const result = await pool.query(
            `INSERT INTO doctors (id, specialty, hospital_name, bio, full_name, available)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
            [user_id, specialty, hospital_name, bio, full_name]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Doctor Registration Error:", err);
        res.status(500).json({ error: err.message || 'Server configuration error' });
    }
});

module.exports = router;