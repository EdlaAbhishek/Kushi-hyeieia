import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jkidsjmbdidryxzwwlld.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraWRzam1iZGlkcnl4end3bGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjE0MzYsImV4cCI6MjA4NzMzNzQzNn0.eUSBh9yf7lf3OQQlcebhSsmz046lcsO6QcTrl6IVUJc'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const DEMO_PASSWORD = 'Demo@1234'

const ACCOUNTS = [
    {
        email: 'patient.demo@khushi.in',
        full_name: 'Aarav Sharma',
        role: 'patient'
    },
    {
        email: 'doctor.demo@khushi.in',
        full_name: 'Dr. Meera Reddy',
        role: 'patient' // signup as patient first, then add to doctors table
    },
    {
        email: 'admin.demo@khushi.in',
        full_name: 'Admin Khushi',
        role: 'patient' // signup as patient first, then add to admins table
    }
]

async function createAccount(account) {
    console.log(`\nCreating: ${account.email} (${account.role})...`)

    // Sign up
    const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: DEMO_PASSWORD,
        options: {
            data: {
                full_name: account.full_name,
                role: account.role
            }
        }
    })

    if (error) {
        // If user already exists, try to sign in
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            console.log(`  Already exists, trying to sign in...`)
            const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
                email: account.email,
                password: DEMO_PASSWORD
            })
            if (loginErr) {
                console.error(`  Login failed: ${loginErr.message}`)
                return null
            }
            console.log(`  Signed in successfully. ID: ${loginData.user.id}`)
            return loginData.user
        }
        console.error(`  Signup error: ${error.message}`)
        return null
    }

    if (!data.user) {
        console.error(`  No user returned`)
        return null
    }

    console.log(`  Created! ID: ${data.user.id}`)
    
    // If email confirmation is enabled but auto-confirmed, the user object should have a confirmed_at
    if (data.user.identities && data.user.identities.length === 0) {
        console.log(`  NOTE: User might already exist (empty identities). Try logging in.`)
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: DEMO_PASSWORD
        })
        if (loginErr) {
            console.error(`  Login failed: ${loginErr.message}`)
            return null
        }
        return loginData.user
    }

    return data.user
}

async function main() {
    console.log('=== Creating Demo Accounts ===')
    console.log(`Password for all: ${DEMO_PASSWORD}\n`)

    const users = {}

    for (const account of ACCOUNTS) {
        const user = await createAccount(account)
        if (user) {
            users[account.email] = user
            // Sign out after each creation to avoid session conflicts
            await supabase.auth.signOut()
        }
    }

    // Now set up roles for doctor and admin
    // First sign in as patient to ensure profiles exist
    console.log('\n=== Setting up roles ===')

    // Set up patient profile
    if (users['patient.demo@khushi.in']) {
        const patientId = users['patient.demo@khushi.in'].id
        console.log(`\nPatient profile for ${patientId}...`)
        const { error } = await supabase.from('patients').upsert({
            id: patientId,
            email: 'patient.demo@khushi.in',
            full_name: 'Aarav Sharma',
            role: 'patient'
        }, { onConflict: 'id' })
        console.log(error ? `  Error: ${error.message}` : '  Done')
    }

    // Set up doctor
    if (users['doctor.demo@khushi.in']) {
        const doctorId = users['doctor.demo@khushi.in'].id
        console.log(`\nDoctor profile for ${doctorId}...`)
        
        // Insert into patients table first
        await supabase.from('patients').upsert({
            id: doctorId,
            email: 'doctor.demo@khushi.in',
            full_name: 'Dr. Meera Reddy',
            role: 'doctor'
        }, { onConflict: 'id' })

        // Insert into doctors table
        const { error } = await supabase.from('doctors').upsert({
            user_id: doctorId,
            full_name: 'Dr. Meera Reddy',
            specialty: 'General Medicine',
            experience: 12,
            email: 'doctor.demo@khushi.in',
            status: 'active'
        }, { onConflict: 'user_id' })
        console.log(error ? `  Error: ${error.message}` : '  Done')
    }

    // Set up admin
    if (users['admin.demo@khushi.in']) {
        const adminId = users['admin.demo@khushi.in'].id
        console.log(`\nAdmin profile for ${adminId}...`)
        
        await supabase.from('patients').upsert({
            id: adminId,
            email: 'admin.demo@khushi.in',
            full_name: 'Admin Khushi',
            role: 'admin'
        }, { onConflict: 'id' })

        const { error } = await supabase.from('admins').upsert({
            id: adminId,
            email: 'admin.demo@khushi.in',
            role: 'admin'
        }, { onConflict: 'id' })
        console.log(error ? `  Error: ${error.message}` : '  Done')
    }

    // Set up record sharing if both patient and doctor exist
    if (users['patient.demo@khushi.in'] && users['doctor.demo@khushi.in']) {
        const patientId = users['patient.demo@khushi.in'].id
        const doctorId = users['doctor.demo@khushi.in'].id
        
        console.log('\n=== Setting up shared records ===')
        
        // Create a demo patient record
        console.log('Creating demo patient record...')
        const { data: existingRecords } = await supabase
            .from('patient_records')
            .select('id')
            .eq('patient_id', patientId)
            .limit(1)
        
        if (!existingRecords || existingRecords.length === 0) {
            const { error: recErr } = await supabase.from('patient_records').insert({
                patient_id: patientId,
                file_url: 'demo/sample_prescription.pdf',
                file_name: 'Demo_Prescription.pdf',
                record_type: 'prescription'
            })
            console.log(recErr ? `  Error: ${recErr.message}` : '  Created demo record')
        } else {
            console.log('  Demo record already exists')
        }

        // Grant doctor access to patient records (7 days)
        console.log('Granting doctor access to patient records...')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

        const { error: permErr } = await supabase.from('record_permissions').insert({
            patient_id: patientId,
            doctor_id: doctorId,
            expires_at: expiresAt.toISOString(),
            access_granted: true,
            access_revoked: false
        })
        console.log(permErr ? `  Error: ${permErr.message}` : '  Granted access for 7 days')
    }

    // Verify by trying to login
    console.log('\n=== Verification: Testing logins ===')
    for (const account of ACCOUNTS) {
        await supabase.auth.signOut()
        const { data, error } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: DEMO_PASSWORD
        })
        if (error) {
            console.log(`  ❌ ${account.email}: ${error.message}`)
        } else {
            console.log(`  ✅ ${account.email}: Login works! (ID: ${data.user.id})`)
        }
    }

    await supabase.auth.signOut()
    console.log('\n=== Done! ===')
    console.log(`All demo accounts use password: ${DEMO_PASSWORD}`)
}

main().catch(console.error)
