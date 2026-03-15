import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jkidsjmbdidryxzwwlld.supabase.co'
// Try to use Anon key to invoke a database function or just find another way.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function main() {
    // Let's create a new account where we pass the role in user_metadata explicitly
    // and see if the frontend picks it up.
    
    // Actually, in AuthContext.js:
    // let userRole = metadataRole || 'patient'
    // It falls back to metadataRole if no profile is found!
    
    console.log("Updating user metadata for demo accounts...");
    
    // Sign in as doctor
    const { data: dData } = await supabase.auth.signInWithPassword({
        email: 'doctor.demo@khushi.in',
        password: 'Demo@1234'
    });
    
    if (dData?.user) {
        const { error } = await supabase.auth.updateUser({
            data: { role: 'doctor' }
        });
        console.log("Doctor metadata update:", error ? error.message : "OK");
    }
    
    // Sign in as admin
    const { data: aData } = await supabase.auth.signInWithPassword({
        email: 'admin.demo@khushi.in',
        password: 'Demo@1234'
    });
    
    if (aData?.user) {
        const { error } = await supabase.auth.updateUser({
            data: { role: 'admin' }
        });
        console.log("Admin metadata update:", error ? error.message : "OK");
    }
}

main().catch(console.error)
