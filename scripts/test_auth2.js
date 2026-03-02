import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function testAuthFull() {
    const results = {};
    const testEmail = `test_patient_${Date.now()}@gmail.com`;

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
        options: {
            data: { full_name: 'Test Patient', role: 'patient' }
        }
    });

    results.signup_error = signUpErr;

    if (!signUpErr && signUpData?.user) {
        results.user_id = signUpData.user.id;
        results.session_exists = !!signUpData.session;

        const { error: insertErr } = await supabase.from('patients').insert([{
            id: signUpData.user.id,
            full_name: 'Test Patient',
            email: testEmail
        }]);

        results.insert_error = insertErr;
    }

    fs.writeFileSync('db_test_auth_results.json', JSON.stringify(results, null, 2));
}

testAuthFull();
