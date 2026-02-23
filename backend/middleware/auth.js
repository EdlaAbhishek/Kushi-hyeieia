/**
 * backend/middleware/auth.js
 * Supabase JWT verification middleware
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // VERY IMPORTANT
);

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = data.user;
        next();

    } catch (err) {
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
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

module.exports = { authenticate, authorise };