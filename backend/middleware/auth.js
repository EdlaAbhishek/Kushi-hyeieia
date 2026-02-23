/**
 * backend/middleware/auth.js
 * Supabase JWT verification middleware
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.SUPABASE_JWT_SECRET
    );

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role:
        decoded.app_metadata?.role ||
        decoded.user_metadata?.role ||
        'patient',
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      details: err.message,
    });
  }
}

module.exports = { authenticate };