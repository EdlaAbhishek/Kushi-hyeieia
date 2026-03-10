const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Fallback manual env parse if dotenv fails
if (!process.env.VITE_SUPABASE_URL) {
    const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
        const [k, ...v] = line.split('=');
        if (k && k.trim() && !k.startsWith('#')) acc[k.trim()] = v.join('=').trim();
        return acc;
    }, {});
    process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
    process.env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
}

if (!process.env.VITE_SUPABASE_URL) {
    console.error("No supabase URL found");
    process.exit(1);
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: users, error: err1 } = await supabase.from('users').select('*').limit(1);
    console.log('users table:', err1 ? err1.message : 'exists');

    const { data: profiles, error: err2 } = await supabase.from('profiles').select('*').limit(1);
    console.log('profiles table:', err2 ? err2.message : 'exists');

    const { data: appt, error: err3 } = await supabase.from('appointments').select('*, patient:users(email)').limit(1);
    console.log('join users:', err3 ? err3.message : (appt && appt[0] && appt[0].patient ? 'success' : 'no join data'));
}
check();
