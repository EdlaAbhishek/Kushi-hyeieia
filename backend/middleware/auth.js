/**
 * backend/middleware/auth.js
 * Supabase JWT verification middleware
 */

const jwt = require('jsonwebtoken');

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[Auth Middleware] Token missing or improperly formatted');
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];

        if (!process.env.SUPABASE_JWT_SECRET) {
            console.error('[Auth Middleware] Missing SUPABASE_JWT_SECRET environment variable!');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        jwt.verify(token, process.env.SUPABASE_JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('[Auth Middleware] Invalid or expired token:', err.message);
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            console.log(`[Auth Middleware] Token valid. Decoded user ID: ${decoded.sub}`);

            // Map the token payload to req.user
            req.user = {
                ...decoded,
                id: decoded.sub // Ensure req.user.id is always available
            };

            next();
        });
    } catch (err) {
        console.error('[Auth Middleware] Unexpected error:', err.message);
        return res.status(401).json({ error: 'Auth failed', details: err.message });
    }
}

function authorise(...roles) {
    return (req, res, next) => {
        const userRole =
            req.user?.app_metadata?.role ||
            req.user?.user_metadata?.role ||
            'patient';

        if (!roles.includes(userRole)) {
            console.error(`[Auth Middleware] User with role ${userRole} attempted to access route restricted to ${roles.join(', ')}`);
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

module.exports = { authenticate, authorise };