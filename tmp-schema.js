import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; };

    log('--- Appointments Schema Attempt ---');
    const { data: appts, error: apptErr } = await supabase.from('appointments').select('*').limit(1);
    if (apptErr) log('Appt Error: ' + JSON.stringify(apptErr));
    else log('Appt Columns: ' + (appts && appts.length ? Object.keys(appts[0]).join(', ') : 'No data, columns unknown'));

    log('\n--- Doctors Schema Attempt ---');
    const { data: docs, error: docErr } = await supabase.from('doctors').select('*').limit(1);
    if (docErr) log('Doc Error: ' + JSON.stringify(docErr));
    else log('Doc Columns: ' + (docs && docs.length ? Object.keys(docs[0]).join(', ') : 'No data, columns unknown'));

    log('\n--- Patients Schema Attempt ---');
    const { data: pats, error: patErr } = await supabase.from('patients').select('*').limit(1);
    if (patErr) log('Pat Error: ' + JSON.stringify(patErr));
    else log('Pat Columns: ' + (pats && pats.length ? Object.keys(pats[0]).join(', ') : 'No data, columns unknown'));

    log('\n--- Test Join Attempt from Dashboard ---');
    const { data: joinData, error: joinErr } = await supabase.from('appointments').select('*, doctors(*)').limit(1);
    
    if (joinErr) log('Join Error: ' + JSON.stringify(joinErr));
    else log('Join Success: Data found = ' + (joinData && joinData.length > 0));
    
    fs.writeFileSync('/tmp/schema-output.txt', output, 'utf8');
}

checkSchema();
