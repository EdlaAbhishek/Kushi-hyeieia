import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function checkSchema() {
    const res = {};

    // Check doctors
    const { data: dData, error: dErr } = await supabase.from('doctors').select('*').limit(1);
    res.doctors = { exists: !dErr || !dErr.message.includes('Could not find the table'), error: dErr?.message };
    if (dData && dData.length > 0) res.doctors.columns = Object.keys(dData[0]);
    else if (!dErr) {
        // if empty, let's just try to insert a dummy and get column error, or simply fetch a non-existent row
        const { error: dummyErr } = await supabase.from('doctors').select('id, full_name, email, specialty, hospital, verified').limit(1);
        res.doctors.select_error = dummyErr?.message;
    }

    // Check patients
    const { data: pData, error: pErr } = await supabase.from('patients').select('*').limit(1);
    res.patients = { exists: !pErr || !pErr.message.includes('Could not find the table'), error: pErr?.message };
    if (pData && pData.length > 0) res.patients.columns = Object.keys(pData[0]);
    else if (!pErr) {
        const { error: dummyErr } = await supabase.from('patients').select('id, full_name, email').limit(1);
        res.patients.select_error = dummyErr?.message;
    }

    // Check users
    const { data: uData, error: uErr } = await supabase.from('users').select('*').limit(1);
    res.users = { exists: !uErr || !uErr.message.includes('Could not find the table'), error: uErr?.message };

    fs.writeFileSync('db_schema_details.json', JSON.stringify(res, null, 2));
}

checkSchema().catch(console.error);
