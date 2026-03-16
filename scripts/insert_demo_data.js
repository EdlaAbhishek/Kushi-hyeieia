import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jkidsjmbdidryxzwwlld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const PWD = 'Demo@1234'

async function main() {
    console.log('=== Log in to get user IDs ===')
    
    // Get doc ID
    await supabase.auth.signOut()
    const { data: docLogin } = await supabase.auth.signInWithPassword({ email: 'doctor.demo@khushi.in', password: PWD })
    const doctorUserId = docLogin?.user?.id
    if (!doctorUserId) { console.log('Doctor login failed'); return }

    // Get pat ID
    await supabase.auth.signOut()
    const { data: patLogin } = await supabase.auth.signInWithPassword({ email: 'patient.demo@khushi.in', password: PWD })
    const patientUserId = patLogin?.user?.id
    if (!patientUserId) { console.log('Patient login failed'); return }

    console.log(`Doctor Auth ID: ${doctorUserId}`)
    console.log(`Patient Auth ID: ${patientUserId}`)

    // Get doctor record ID from doctors table
    const { data: docRecords } = await supabase.from('doctors').select('id').eq('user_id', doctorUserId)
    if (!docRecords || docRecords.length === 0) { console.log('Doctor record not found'); return }
    const doctorTableId = docRecords[0].id
    console.log(`Doctor Table ID: ${doctorTableId}`)

    // Create a demo hospital if it doesn't exist
    let hospitalId;
    const { data: existingHospitals } = await supabase.from('hospitals').select('id').eq('name', 'Apollo Hospitals Jubilee Hills').limit(1)
    
    if (existingHospitals && existingHospitals.length > 0) {
        hospitalId = existingHospitals[0].id;
        console.log(`Found existing hospital: ${hospitalId}`)
    } else {
        const { data: newHospital, error: hospErr } = await supabase.from('hospitals').insert({
            name: 'Apollo Hospitals Jubilee Hills',
            city: 'Hyderabad',
            address: 'Road No 72, Opp. Bharatiya Vidya Bhavan, Film Nagar, Hyderabad, Telangana 500033',
            lat: 17.4241,
            lng: 78.4093,
            phone: '040 2360 7777',
            emergency: true
        }).select()
        
        if (hospErr) { console.log('Error creating hospital:', hospErr); return }
        hospitalId = newHospital[0].id
        console.log(`Created new hospital: ${hospitalId}`)
    }

    // Link doctor to hospital
    await supabase.from('doctors').update({ hospital_id: hospitalId }).eq('id', doctorTableId)
    console.log('Linked doctor to hospital')

    // Delete existing demo appointments to prevent duplicates
    await supabase.from('appointments')
        .delete()
        .eq('patient_id', patientUserId)
        .eq('doctor_id', doctorTableId)

    // Insert mock appointments
    console.log('Inserting mock appointments...')
    
    const now = new Date();
    
    // Past appointment
    let pastDate = new Date(now);
    pastDate.setDate(now.getDate() - 5);
    pastDate.setHours(10, 30, 0, 0);

    // Upcoming appointment
    let futureDate1 = new Date(now);
    futureDate1.setDate(now.getDate() + 2);
    futureDate1.setHours(14, 0, 0, 0);

    // Another upcoming teleconsultation
    let futureDate2 = new Date(now);
    futureDate2.setDate(now.getDate() + 5);
    futureDate2.setHours(16, 45, 0, 0);

    const appointments = [
        {
            patient_id: patientUserId,
            doctor_id: doctorTableId,
            hospital_id: hospitalId,
            scheduled_at: pastDate.toISOString(),
            type: 'in-person',
            status: 'completed',
            notes: 'Patient complained of mild fever. Prescribed Paracetamol.',
            symptoms: ['Fever', 'Fatigue']
        },
        {
            patient_id: patientUserId,
            doctor_id: doctorTableId,
            hospital_id: hospitalId,
            scheduled_at: futureDate1.toISOString(),
            type: 'in-person',
            status: 'confirmed',
            notes: 'Follow up visit for recent blood tests.',
            symptoms: []
        },
        {
            patient_id: patientUserId,
            doctor_id: doctorTableId,
            hospital_id: null,
            scheduled_at: futureDate2.toISOString(),
            type: 'telehealth',
            status: 'confirmed',
            notes: 'Routine checkup via video call.',
            symptoms: ['Cough']
        }
    ]

    const { error: apptErr } = await supabase.from('appointments').insert(appointments)
    
    if (apptErr) {
        console.log('Error inserting appointments:', apptErr)
    } else {
        console.log('Successfully inserted 3 mock appointments!')
    }

    console.log('\n=== DONE ===')
}

main().catch(console.error)
