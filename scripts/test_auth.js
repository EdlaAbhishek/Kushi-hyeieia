import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function testAuth() {
    console.log("=== Testing Patient Signup ===");
    const testEmail = `test_patient_${Date.now()}@example.com`;
    const { data: pSignUpData, error: pSignUpErr } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
        options: {
            data: { full_name: 'Test Patient', role: 'patient' }
        }
    });

    if (pSignUpErr) {
        console.error("Patient Signup Auth Error:", pSignUpErr.message);
    } else {
        const user = pSignUpData.user;
        console.log("Patient Auth Success. User ID:", user.id);
        const { error: pInsertErr } = await supabase.from('patients').insert([{
            id: user.id,
            full_name: 'Test Patient',
            email: testEmail
        }]);
        if (pInsertErr) {
            console.error("Patient DB Insert Error:", pInsertErr.message);
        } else {
            console.log("Patient DB Insert Success.");
        }
    }

    console.log("\n=== Testing Doctor Signup ===");
    const testDocEmail = `test_doctor_${Date.now()}@example.com`;
    const { data: dSignUpData, error: dSignUpErr } = await supabase.auth.signUp({
        email: testDocEmail,
        password: 'password123',
        options: {
            data: { full_name: 'Test Doctor', role: 'doctor' }
        }
    });

    if (dSignUpErr) {
        console.error("Doctor Signup Auth Error:", dSignUpErr.message);
    } else {
        const user = dSignUpData.user;
        console.log("Doctor Auth Success. User ID:", user.id);
        const { error: dInsertErr } = await supabase.from('doctors').insert([{
            id: user.id,
            full_name: 'Test Doctor',
            email: testDocEmail,
            specialty: 'Cardiology',
            hospital: 'Test Hospital',
            verified: false
        }]);
        if (dInsertErr) {
            console.error("Doctor DB Insert Error:", dInsertErr.message);
        } else {
            console.log("Doctor DB Insert Success.");
        }
    }
}

testAuth();
