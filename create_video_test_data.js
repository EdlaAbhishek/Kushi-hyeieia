import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTestAppointment() {
    console.log("Setting up Test Environments for Video Call feature using actual credentials...")
    const doctorEmail = '247r1a66m4@cmrtc.ac.in'

    // 1. Find User by email
    const { data: userRow, error: uError } = await supabase.from('users').select('id, full_name, role').eq('email', doctorEmail).single()
    if (uError || !userRow) {
        console.error("Could not find user with email: " + doctorEmail, uError)
        return
    }

    console.log(`Found User ID: ${userRow.id} (Role: ${userRow.role})`)

    // 2. See if they are an active Doctor
    const { data: doctorRow, error: dError } = await supabase.from('doctors').select('id, verified').eq('user_id', userRow.id).single()
    if (dError || !doctorRow) {
        console.error("This user has not successfully registered as a verified doctor yet.", dError)
        return // Cannot book appointment easily
    }

    const actualDoctorId = doctorRow.id
    console.log(`User is a Doctor! Doctor ID: ${actualDoctorId}`)

    // 3. Create a dummy patient if one doesn't exist
    const baseEmailSalt = Date.now().toString().slice(-4)
    const patientEmail = `video_patient_${baseEmailSalt}@test.com`
    const patientPassword = `Pass1234!`
    console.log(`Creating test patient: ${patientEmail}`)

    const { data: patientAuth, error: pError } = await supabase.auth.signUp({
        email: patientEmail,
        password: patientPassword,
        options: {
            data: { full_name: 'Test Setup Patient', role: 'patient' }
        }
    })

    if (pError) {
        console.error("Patient Auth Error:", pError)
        return
    }

    const patientId = patientAuth.user.id
    console.log("Waiting 3s for user triggers...")
    await new Promise(res => setTimeout(res, 3000))

    // 3. Book the appointment
    console.log("Booking teleconsultation appointment for Doctor: ", doctorRow.id)
    const testDateStr = new Date(Date.now() + 5 * 60000).toISOString() // 5 mins from now

    // We must authenticate as the patient to insert the appointment legally via RLS
    await supabase.auth.signInWithPassword({ email: patientEmail, password: patientPassword })

    const { error: apptError } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: actualDoctorId,
        type: 'teleconsultation',
        status: 'confirmed',
        scheduled_at: testDateStr,
        notes: "Automated test appointment for video call"
    })

    if (apptError) {
        console.error("Failed to create appointment.", apptError)
        return
    }

    console.log("✅ Custom test data ready!")
    console.log("------------------------------------------")
    console.log("Here are the credentials for your PATIENT account:")
    console.log(`Email: ${patientEmail}`)
    console.log(`Password: ${patientPassword}`)
    console.log("------------------------------------------")
}

setupTestAppointment()
