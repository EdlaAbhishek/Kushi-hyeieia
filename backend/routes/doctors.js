/**
 * backend/routes/doctors.js
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.id, d.specialty, d.hospital, p.full_name
            FROM doctors d
            JOIN profiles p ON d.profile_id = p.id
            ORDER BY p.full_name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server configuration error' });
    }
});

module.exports = router;