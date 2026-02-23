import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.localStorage
    }
})

export const emergencyReset = () => {
    console.warn("Performing emergency auth reset...");
    window.localStorage.clear();
    // Clear locked indexedDB if any
    try {
        indexedDB.deleteDatabase('supabase-auth-token');
    } catch (e) { }
    window.location.reload();
}