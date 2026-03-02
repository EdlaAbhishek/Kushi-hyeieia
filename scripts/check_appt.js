import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://jkidsjmbdidryxzwwlld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'
);

async function checkAppt() {
    const { data, error } = await supabase.from('appointments').select('*').limit(1);
    const res = { exists: !error, columns: data && data.length > 0 ? Object.keys(data[0]) : [], error: error?.message };

    // Attempt an insert with empty to parse error 
    if (!res.columns.length && !error) {
        const { error: insErr } = await supabase.from('appointments').insert([{}]).select();
        res.insert_error = insErr?.message || insErr?.details || "No error on empty insert?";
    }

    fs.writeFileSync('appt_schema.json', JSON.stringify(res, null, 2));
}

checkAppt();
