/**
 * backend/controllers/authController.js
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

async function register(req, res, next) {
    try {
        const { full_name, email, password, role = 'patient' } = req.body;
        const existing = await User.findByEmail(email);
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const password_hash = await bcrypt.hash(password, 12);
        const user = await User.create({ full_name, email, password_hash, role });

        const token = signToken(user);
        res.status(201).json({ token, user: sanitise(user) });
    } catch (err) { next(err); }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = signToken(user);
        res.json({ token, user: sanitise(user) });
    } catch (err) { next(err); }
}

function logout(_req, res) {
    // JWT is stateless; client removes token. Optionally add to a denylist here.
    res.json({ message: 'Logged out' });
}

function signToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRES_IN }
    );
}

function sanitise({ id, full_name, email, role, created_at }) {
    return { id, full_name, email, role, created_at };
}

module.exports = { register, login, logout };
