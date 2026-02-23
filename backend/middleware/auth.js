/**
 * backend/middleware/auth.js
 * JWT verification middleware for Supabase Auth tokens
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.slice(7);
    try {
        // Supabase signs tokens with the JWT_SECRET found in your project API settings
        const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || config.JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        // Supabase puts user id in the 'sub' claim
        req.user = { id: decoded.sub, ...decoded };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
    }
}

function authorise(...roles) {
    return (req, res, next) => {
        // With Supabase Auth, roles might be in app_metadata or user_metadata, or we infer from the DB layer
        const userRole = req.user?.app_metadata?.role || req.user?.user_metadata?.role || 'patient';
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = { authenticate, authorise };
