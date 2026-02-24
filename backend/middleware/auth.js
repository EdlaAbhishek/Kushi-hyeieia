const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error('[Auth Middleware] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables!');
}

async function authenticate(req, res, next) {
  try {
    if (!supabase) {
      console.error('[Auth Middleware] Supabase client not initialized due to missing environment variables.');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Auth Middleware] Token missing or improperly formatted');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('[Auth Middleware] Invalid or expired token:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Unexpected error:', err.message);
    return res.status(500).json({ error: 'Server configuration error' });
  }
}

function authorise(...roles) {
  return (req, res, next) => {
    try {
      const userRole =
        req.user?.app_metadata?.role ||
        req.user?.user_metadata?.role ||
        'patient';

      if (!roles.includes(userRole)) {
        console.error(`[Auth Middleware] User with role ${userRole} attempted to access route restricted to ${roles.join(', ')}`);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      console.error('[Auth Middleware] Role authorization error:', err.message);
      return res.status(500).json({ error: 'Server configuration error' });
    }
  };
}

module.exports = { authenticate, authorise };