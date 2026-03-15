import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jkidsjmbdidryxzwwlld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const PWD = 'Demo@1234'

async function main() {
    // ---- Step 1: Sign in as doctor and set up doctor profile ----
    console.log('=== Setting up Doctor role ===')
    await supabase.auth.signOut()
    const { data: docLogin, error: docLoginErr } = await supabase.auth.signInWithPassword({
        email: 'doctor.demo@khushi.in', password: PWD
    })
    if (docLoginErr) { console.log('Doctor login failed:', docLoginErr.message); return }
    
    const doctorUserId = docLogin.user.id
    console.log('Doctor user ID:', doctorUserId)

    // Update patients table role
    const { error: patUpd } = await supabase.from('patients').upsert({
        id: doctorUserId,
        email: 'doctor.demo@khushi.in',
        full_name: 'Dr. Meera Reddy',
        role: 'doctor'
    }, { onConflict: 'id' })
    console.log('Patient role update:', patUpd ? patUpd.message : 'OK')

    // Insert into doctors table
    const { error: docIns } = await supabase.from('doctors').upsert({
        user_id: doctorUserId,
        full_name: 'Dr. Meera Reddy',
        specialty: 'General Medicine',
        experience: 12,
        email: 'doctor.demo@khushi.in',
        status: 'active'
    }, { onConflict: 'user_id' })
    console.log('Doctor insert:', docIns ? docIns.message : 'OK')

    // Read back to verify
    const { data: docCheck } = await supabase.from('doctors').select('id,user_id,full_name').eq('user_id', doctorUserId)
    console.log('Doctor check:', JSON.stringify(docCheck))

    // ---- Step 2: Sign in as admin and set up admin profile ----
    console.log('\n=== Setting up Admin role ===')
    await supabase.auth.signOut()
    const { data: admLogin, error: admLoginErr } = await supabase.auth.signInWithPassword({
        email: 'admin.demo@khushi.in', password: PWD
    })
    if (admLoginErr) { console.log('Admin login failed:', admLoginErr.message); return }
    
    const adminUserId = admLogin.user.id
    console.log('Admin user ID:', adminUserId)

    const { error: admPatUpd } = await supabase.from('patients').upsert({
        id: adminUserId,
        email: 'admin.demo@khushi.in',
        full_name: 'Admin Khushi',
        role: 'admin'
    }, { onConflict: 'id' })
    console.log('Admin patient update:', admPatUpd ? admPatUpd.message : 'OK')

    const { error: admIns } = await supabase.from('admins').upsert({
        id: adminUserId,
        email: 'admin.demo@khushi.in',
        role: 'admin'
    }, { onConflict: 'id' })
    console.log('Admin insert:', admIns ? admIns.message : 'OK')

    const { data: admCheck } = await supabase.from('admins').select('*').eq('id', adminUserId)
    console.log('Admin check:', JSON.stringify(admCheck))

    // ---- Step 3: Sign in as patient and set up records + sharing ----
    console.log('\n=== Setting up Patient records & sharing ===')
    await supabase.auth.signOut()
    const { data: patLogin, error: patLoginErr } = await supabase.auth.signInWithPassword({
        email: 'patient.demo@khushi.in', password: PWD
    })
    if (patLoginErr) { console.log('Patient login failed:', patLoginErr.message); return }
    
    const patientUserId = patLogin.user.id
    console.log('Patient user ID:', patientUserId)

    // Create a demo patient record
    const { data: existingRecs } = await supabase.from('patient_records')
        .select('id').eq('patient_id', patientUserId).limit(1)
    
    if (!existingRecs || existingRecs.length === 0) {
        const { error: recErr } = await supabase.from('patient_records').insert({
            patient_id: patientUserId,
            file_url: 'demo/sample_prescription.pdf',
            file_name: 'Demo_Prescription.pdf',
            record_type: 'prescription'
        })
        console.log('Record insert:', recErr ? recErr.message : 'OK')
    } else {
        console.log('Record already exists')
    }

    // Get doctor ID from doctors table
    const { data: doctorRow } = await supabase.from('doctors')
        .select('id').eq('user_id', doctorUserId).limit(1)
    
    const doctorTableId = doctorRow?.[0]?.id || doctorUserId
    console.log('Doctor table ID to use for sharing:', doctorTableId)

    // Grant access to doctor (7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: permErr } = await supabase.from('record_permissions').insert({
        patient_id: patientUserId,
        doctor_id: doctorUserId, // use auth user_id since DoctorPatientRecords queries by user.id
        expires_at: expiresAt.toISOString(),
        access_granted: true,
        access_revoked: false
    })
    console.log('Permission insert:', permErr ? permErr.message : 'OK')

    // Verify records and permissions
    const { data: recs } = await supabase.from('patient_records')
        .select('id,file_name,record_type').eq('patient_id', patientUserId)
    console.log('Patient records:', JSON.stringify(recs))

    const { data: perms } = await supabase.from('record_permissions')
        .select('*').eq('patient_id', patientUserId)
    console.log('Permissions:', JSON.stringify(perms))

    await supabase.auth.signOut()
    console.log('\n=== DONE ===')
}

main().catch(console.error)
