import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function testDB() {
    const results = {};
    const fakeId = '11111111-2222-3333-4444-555555555555';

    const { error: pInsertErr } = await supabase.from('patients').insert([{
        id: fakeId,
        full_name: 'Direct Test Patient',
        email: 'direct_patient@test.com'
    }]);
    results.patient_error = pInsertErr;

    const { error: dInsertErr } = await supabase.from('doctors').insert([{
        id: fakeId,
        full_name: 'Direct Test Doctor',
        email: 'direct_doctor@test.com',
        specialty: 'Cardiology',
        hospital: 'Test Hospital',
        verified: false
    }]);
    results.doctor_error = dInsertErr;

    fs.writeFileSync('db_test_results.json', JSON.stringify(results, null, 2));
}

testDB();
