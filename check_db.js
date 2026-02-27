import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function checkSchema() {
    const res = {};
    const { data: dData, error: dErr } = await supabase.from('doctors').select('*').limit(1);
    res.doctors = { exists: !dErr, columns: dData ? Object.keys(dData[0] || {}) : [], error: dErr?.message };

    const { data: uData, error: uErr } = await supabase.from('users').select('*').limit(1);
    res.users = { exists: !uErr, columns: uData ? Object.keys(uData[0] || {}) : [], error: uErr?.message };

    const { data: pData, error: pErr } = await supabase.from('patients').select('*').limit(1);
    res.patients = { exists: !pErr, columns: pData ? Object.keys(pData[0] || {}) : [], error: pErr?.message };

    fs.writeFileSync('output.json', JSON.stringify(res, null, 2));
}

checkSchema().catch(console.error);
