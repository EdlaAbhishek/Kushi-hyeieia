/**
 * Insert Demo Doctors Script
 * Run: node scripts/insert-demo-doctors.mjs
 *
 * This inserts realistic fake doctors into Supabase for demo purposes.
 * Uses the Supabase service role key or anon key from .env
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const DEMO_DOCTORS = [
    {
        full_name: 'Dr. Aravind Reddy',
        name: 'Dr. Aravind Reddy',
        email: 'aravind.reddy@khushihygieia.demo',
        specialty: 'Cardiology',
        hospital_name: 'Apollo Hospitals, Hyderabad',
        hospital: 'Apollo Hospitals, Hyderabad',
        experience: 15,
        bio: 'Senior Cardiologist with expertise in interventional cardiology and heart failure management. Fellowship from AIIMS Delhi.',
        license_number: 'TSMC-28471',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 800,
        qualification: 'MBBS, MD (Cardiology), DM (Cardiology)',
        available_timings: '9:00 AM - 5:00 PM',
        teleconsultation_available: true
    },
    {
        full_name: 'Dr. Priya Sharma',
        name: 'Dr. Priya Sharma',
        email: 'priya.sharma@khushihygieia.demo',
        specialty: 'Dermatology',
        hospital_name: 'KIMS Hospital, Secunderabad',
        hospital: 'KIMS Hospital, Secunderabad',
        experience: 10,
        bio: 'Renowned dermatologist specializing in cosmetic dermatology, acne treatment, and skin cancer screening.',
        license_number: 'TSMC-35892',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 600,
        qualification: 'MBBS, MD (Dermatology)',
        available_timings: '10:00 AM - 6:00 PM',
        teleconsultation_available: true
    },
    {
        full_name: 'Dr. Rajesh Kumar',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.kumar@khushihygieia.demo',
        specialty: 'Orthopedics',
        hospital_name: 'Care Hospitals, Banjara Hills',
        hospital: 'Care Hospitals, Banjara Hills',
        experience: 20,
        bio: 'Leading orthopedic surgeon with expertise in joint replacement, sports medicine, and spinal surgeries. Over 5000 successful surgeries.',
        license_number: 'TSMC-18234',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 1000,
        qualification: 'MBBS, MS (Ortho), MCh (Ortho)',
        available_timings: '9:00 AM - 4:00 PM',
        teleconsultation_available: false
    },
    {
        full_name: 'Dr. Sneha Patel',
        name: 'Dr. Sneha Patel',
        email: 'sneha.patel@khushihygieia.demo',
        specialty: 'Pediatrics',
        hospital_name: 'Rainbow Children\'s Hospital, Hyderabad',
        hospital: 'Rainbow Children\'s Hospital, Hyderabad',
        experience: 12,
        bio: 'Pediatric specialist with focus on neonatal care, childhood infections, and growth & development. Women-friendly practice.',
        license_number: 'TSMC-42156',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 500,
        qualification: 'MBBS, MD (Pediatrics), DNB',
        available_timings: '10:00 AM - 7:00 PM',
        teleconsultation_available: true,
        gender: 'female',
        women_friendly: true
    },
    {
        full_name: 'Dr. Mohammed Irfan',
        name: 'Dr. Mohammed Irfan',
        email: 'irfan.mohammed@khushihygieia.demo',
        specialty: 'General Medicine',
        hospital_name: 'Yashoda Hospitals, Somajiguda',
        hospital: 'Yashoda Hospitals, Somajiguda',
        experience: 8,
        bio: 'General physician skilled in managing diabetes, hypertension, and infectious diseases. Trusted family doctor.',
        license_number: 'TSMC-51093',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 400,
        qualification: 'MBBS, MD (General Medicine)',
        available_timings: '8:00 AM - 8:00 PM',
        teleconsultation_available: true
    },
    {
        full_name: 'Dr. Lakshmi Narasimhan',
        name: 'Dr. Lakshmi Narasimhan',
        email: 'lakshmi.n@khushihygieia.demo',
        specialty: 'ENT',
        hospital_name: 'Continental Hospitals, Gachibowli',
        hospital: 'Continental Hospitals, Gachibowli',
        experience: 14,
        bio: 'ENT surgeon specializing in sinus surgery, hearing disorders, and head & neck oncology.',
        license_number: 'TSMC-29874',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 700,
        qualification: 'MBBS, MS (ENT)',
        available_timings: '9:00 AM - 5:00 PM',
        teleconsultation_available: true,
        gender: 'female'
    },
    {
        full_name: 'Dr. Venkat Rao',
        name: 'Dr. Venkat Rao',
        email: 'venkat.rao@khushihygieia.demo',
        specialty: 'Neurology',
        hospital_name: 'Apollo Hospitals, Jubilee Hills',
        hospital: 'Apollo Hospitals, Jubilee Hills',
        experience: 18,
        bio: 'Neurologist with expertise in stroke management, epilepsy, and neurodegenerative disorders. Published 50+ research papers.',
        license_number: 'TSMC-15672',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'busy',
        consultation_fee: 1200,
        qualification: 'MBBS, MD (Neurology), DM (Neurology)',
        available_timings: '10:00 AM - 3:00 PM',
        teleconsultation_available: false
    },
    {
        full_name: 'Dr. Anitha Krishnan',
        name: 'Dr. Anitha Krishnan',
        email: 'anitha.k@khushihygieia.demo',
        specialty: 'Gynecology',
        hospital_name: 'Fernandez Hospital, Hyderabad',
        hospital: 'Fernandez Hospital, Hyderabad',
        experience: 16,
        bio: 'Obstetrician & Gynecologist with specialization in high-risk pregnancies, laparoscopic surgery, and infertility treatment.',
        license_number: 'TSMC-22341',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 900,
        qualification: 'MBBS, MS (OBG), DNB',
        available_timings: '9:00 AM - 6:00 PM',
        teleconsultation_available: true,
        gender: 'female',
        women_friendly: true
    },
    {
        full_name: 'Dr. Srinivas Gupta',
        name: 'Dr. Srinivas Gupta',
        email: 'srinivas.g@khushihygieia.demo',
        specialty: 'Ophthalmology',
        hospital_name: 'L V Prasad Eye Institute',
        hospital: 'L V Prasad Eye Institute',
        experience: 22,
        bio: 'Senior ophthalmologist specializing in cataract surgery, LASIK, and retinal disorders. Pioneer in corneal transplant techniques.',
        license_number: 'TSMC-10945',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 750,
        qualification: 'MBBS, MS (Ophthalmology), FRCS',
        available_timings: '8:30 AM - 4:30 PM',
        teleconsultation_available: false
    },
    {
        full_name: 'Dr. Kavitha Devi',
        name: 'Dr. Kavitha Devi',
        email: 'kavitha.d@khushihygieia.demo',
        specialty: 'Psychiatry',
        hospital_name: 'NIMHANS Outreach, Hyderabad',
        hospital: 'NIMHANS Outreach, Hyderabad',
        experience: 11,
        bio: 'Psychiatrist specializing in anxiety, depression, and adolescent mental health. Compassionate and culturally sensitive approach.',
        license_number: 'TSMC-38567',
        verified: true,
        is_approved: true,
        available: true,
        availability_status: 'available',
        consultation_fee: 600,
        qualification: 'MBBS, MD (Psychiatry)',
        available_timings: '10:00 AM - 7:00 PM',
        teleconsultation_available: true,
        gender: 'female',
        women_friendly: true
    }
]

async function insertDoctors() {
    console.log('🏥 Inserting demo doctors into Supabase...\n')
    
    let inserted = 0
    let skipped = 0
    
    for (const doc of DEMO_DOCTORS) {
        // Check if already exists by email
        const { data: existing } = await supabase
            .from('doctors')
            .select('id')
            .eq('email', doc.email)
            .maybeSingle()
        
        if (existing) {
            console.log(`  ⏭️  ${doc.full_name} already exists, skipping`)
            skipped++
            continue
        }
        
        const { error } = await supabase
            .from('doctors')
            .insert(doc)
        
        if (error) {
            console.error(`  ❌ Failed to insert ${doc.full_name}:`, error.message)
        } else {
            console.log(`  ✅ ${doc.full_name} — ${doc.specialty} @ ${doc.hospital_name}`)
            inserted++
        }
    }
    
    console.log(`\n📊 Summary: ${inserted} inserted, ${skipped} skipped (already existed)`)
    console.log('✨ Done!')
}

insertDoctors().catch(console.error)
