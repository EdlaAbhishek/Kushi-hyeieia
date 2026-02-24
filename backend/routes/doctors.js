/**
 * backend/routes/doctors.js
 */
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.id, d.specialty, d.hospital_name as hospital, u.full_name
            FROM doctors d
            JOIN profiles u ON d.id = u.id
            ORDER BY u.full_name
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server configuration error' });
    }
});

module.exports = router;