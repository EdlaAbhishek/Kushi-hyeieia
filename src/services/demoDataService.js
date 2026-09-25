import { supabase } from './supabase'

/**
 * Demo data seed for all new modules.
 * Clearly labeled as simulated. Call once per user to populate demo content.
 */

export async function seedDemoData(userId) {
    const results = { success: [], errors: [] }

    try {
        // 1. Demo Health Documents
        const healthDocs = [
            { patient_id: userId, title: 'Complete Blood Count (CBC)', category: 'lab_report', hospital_lab: 'Apollo Diagnostics', report_date: '2026-09-15', verification: 'verified', is_demo: true },
            { patient_id: userId, title: 'Chest X-Ray Report', category: 'imaging', hospital_lab: 'KIMS Hospital', report_date: '2026-08-20', verification: 'verified', is_demo: true },
            { patient_id: userId, title: 'Dr. Sharma Consultation Notes', category: 'doctor_notes', hospital_lab: 'Care Hospitals', doctor_name: 'Dr. Priya Sharma', report_date: '2026-09-10', verification: 'unverified', is_demo: true },
            { patient_id: userId, title: 'Metformin Prescription', category: 'prescription', hospital_lab: 'Yashoda Hospitals', doctor_name: 'Dr. Rajesh Kumar', report_date: '2026-09-01', verification: 'verified', is_demo: true },
            { patient_id: userId, title: 'COVID-19 Vaccination Certificate', category: 'vaccination', hospital_lab: 'Government PHC', report_date: '2026-03-15', verification: 'verified', is_demo: true },
            { patient_id: userId, title: 'Annual Health Checkup', category: 'lab_report', hospital_lab: 'Apollo Hospitals', report_date: '2026-07-01', verification: 'verified', is_demo: true },
            { patient_id: userId, title: 'Discharge Summary - Appendectomy', category: 'discharge_summary', hospital_lab: 'NIMS Hospital', report_date: '2026-06-15', verification: 'verified', is_demo: true }
        ]
        const { error: docErr } = await supabase.from('health_documents').insert(healthDocs)
        if (docErr) results.errors.push('health_documents: ' + docErr.message)
        else results.success.push('health_documents')

        // 2. Demo Pending Lab Reports
        const pendingReports = [
            { patient_id: userId, lab_name: 'Apollo Diagnostics', report_title: 'CBC Blood Test', report_date: '2026-09-25', transfer_code: 'KH-APL-7291', status: 'pending', is_demo: true },
            { patient_id: userId, lab_name: 'Thyrocare', report_title: 'Thyroid Panel (T3, T4, TSH)', report_date: '2026-09-24', transfer_code: 'KH-THY-3845', status: 'pending', is_demo: true }
        ]
        const { error: pendErr } = await supabase.from('pending_lab_reports').insert(pendingReports)
        if (pendErr) results.errors.push('pending_lab_reports: ' + pendErr.message)
        else results.success.push('pending_lab_reports')

        // 3. Demo Prescriptions + Medications
        const { data: rxData, error: rxErr } = await supabase.from('prescriptions').insert([{
            patient_id: userId,
            doctor_name: 'Dr. Rajesh Kumar',
            hospital_name: 'Yashoda Hospitals',
            diagnosis: 'Type 2 Diabetes Mellitus',
            prescription_date: '2026-09-01',
            status: 'active',
            is_demo: true
        }]).select()
        if (rxErr) results.errors.push('prescriptions: ' + rxErr.message)
        else {
            results.success.push('prescriptions')
            const rxId = rxData[0].id

            const meds = [
                { prescription_id: rxId, patient_id: userId, name: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily', timing: 'After meals', instructions: 'Take after breakfast and dinner', duration_days: 90, start_date: '2026-09-01', is_demo: true },
                { prescription_id: rxId, patient_id: userId, name: 'Glimepiride 1mg', dosage: '1mg', frequency: 'Once daily', timing: 'Before breakfast', instructions: 'Take 30 minutes before breakfast', duration_days: 90, start_date: '2026-09-01', is_demo: true },
                { prescription_id: rxId, patient_id: userId, name: 'Atorvastatin 10mg', dosage: '10mg', frequency: 'Once daily', timing: 'At bedtime', instructions: 'Take at night before sleep', duration_days: 90, start_date: '2026-09-01', is_demo: true }
            ]
            const { data: medData, error: medErr } = await supabase.from('medications').insert(meds).select()
            if (medErr) results.errors.push('medications: ' + medErr.message)
            else {
                results.success.push('medications')
                // Create schedules for first medication (Metformin)
                const metforminId = medData[0].id
                const schedules = [
                    { medication_id: metforminId, patient_id: userId, scheduled_time: '08:00', label: 'Morning', meal_relation: 'after_meal', is_confirmed: true },
                    { medication_id: metforminId, patient_id: userId, scheduled_time: '20:00', label: 'Evening', meal_relation: 'after_meal', is_confirmed: true }
                ]
                const glimeId = medData[1].id
                schedules.push({ medication_id: glimeId, patient_id: userId, scheduled_time: '07:30', label: 'Morning', meal_relation: 'before_meal', is_confirmed: true })
                const atorId = medData[2].id
                schedules.push({ medication_id: atorId, patient_id: userId, scheduled_time: '22:00', label: 'Night', meal_relation: 'anytime', is_confirmed: true })

                const { error: schedErr } = await supabase.from('medication_schedules').insert(schedules)
                if (schedErr) results.errors.push('medication_schedules: ' + schedErr.message)
                else results.success.push('medication_schedules')
            }
        }

        // 4. Demo Insurance Policy + Claim
        const { data: policyData, error: polErr } = await supabase.from('insurance_policies').insert([{
            patient_id: userId,
            provider: 'Star Health',
            policy_number: 'P/2026/SH/0042891',
            policy_type: 'Individual',
            sum_insured: 500000,
            premium: 12500,
            valid_from: '2026-01-01',
            valid_until: '2026-12-31',
            status: 'active',
            coverage_details: { room_rent: '₹5,000/day', icu: '₹10,000/day', daycare: true, maternity: false, pre_existing_waiting: '3 years' },
            network_hospitals: ['Apollo Hospitals', 'KIMS Hospital', 'Yashoda Hospitals', 'Care Hospitals', 'NIMS Hospital'],
            is_demo: true
        }]).select()
        if (polErr) results.errors.push('insurance_policies: ' + polErr.message)
        else {
            results.success.push('insurance_policies')
            const polId = policyData[0].id

            const { error: claimErr } = await supabase.from('insurance_claims').insert([{
                policy_id: polId,
                patient_id: userId,
                claim_number: 'CLM-2026-09-00127',
                hospital_name: 'KIMS Hospital',
                treatment: 'Appendectomy',
                claim_amount: 85000,
                approved_amount: 78000,
                submitted_date: '2026-06-20',
                status: 'settled',
                status_history: [
                    { status: 'draft', date: '2026-06-18', note: 'Claim created' },
                    { status: 'documents_uploaded', date: '2026-06-19', note: 'All documents uploaded' },
                    { status: 'submitted', date: '2026-06-20', note: 'Submitted to Star Health' },
                    { status: 'under_review', date: '2026-06-25', note: 'Under review by insurer' },
                    { status: 'approved', date: '2026-07-02', note: 'Approved for ₹78,000' },
                    { status: 'settled', date: '2026-07-10', note: 'Amount credited to hospital' }
                ],
                is_demo: true
            }])
            if (claimErr) results.errors.push('insurance_claims: ' + claimErr.message)
            else results.success.push('insurance_claims')
        }

        // 5. Demo Volunteer Tasks
        const tasks = [
            { title: 'Patient Escort - Block A', description: 'Help elderly patient navigate from reception to Orthopedics department', task_type: 'patient_escort', location: 'KIMS Hospital, Block A', scheduled_date: '2026-09-26', scheduled_time: '10:00', status: 'open', is_demo: true },
            { title: 'Wheelchair Assistance', description: 'Assist patient with wheelchair from parking to OPD registration', task_type: 'wheelchair', location: 'Apollo Hospitals, Main Entrance', scheduled_date: '2026-09-26', scheduled_time: '14:30', status: 'open', is_demo: true },
            { title: 'Medicine Pickup', description: 'Pick up prescribed medicines from hospital pharmacy for discharged patient', task_type: 'medicine_pickup', location: 'Yashoda Hospitals, Pharmacy', scheduled_date: '2026-09-27', scheduled_time: '11:00', status: 'open', is_demo: true },
            { title: 'Blood Donation Camp', description: 'Help organize blood donation camp at community center', task_type: 'blood_donation', location: 'Secunderabad Community Hall', scheduled_date: '2026-10-02', scheduled_time: '09:00', status: 'open', is_demo: true },
            { title: 'Health Awareness Drive', description: 'Distribute diabetes awareness pamphlets in rural area', task_type: 'awareness', location: 'Medchal Village', scheduled_date: '2026-10-05', scheduled_time: '08:00', status: 'open', is_demo: true }
        ]
        const { error: taskErr } = await supabase.from('volunteer_tasks').insert(tasks)
        if (taskErr) results.errors.push('volunteer_tasks: ' + taskErr.message)
        else results.success.push('volunteer_tasks')

    } catch (err) {
        results.errors.push('Global error: ' + err.message)
    }

    return results
}

/**
 * Check if demo data exists for a user
 */
export async function hasDemoData(userId) {
    const { count } = await supabase
        .from('health_documents')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', userId)
        .eq('is_demo', true)
    return (count || 0) > 0
}
