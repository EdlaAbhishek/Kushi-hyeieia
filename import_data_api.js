import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// Create a single supabase client
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const hospitals = [
    { name: "Apollo Hospitals, Jubilee Hills", city: "Hyderabad", address: "Film Nagar Main Road, Jubilee Hills", phone: "+91 40 2360 7777", spec1: "Cardiology", spec2: "Neurology" },
    { name: "PACE Hospitals, HITEC City", city: "Hyderabad", address: "Beside Avasa Hotel, Hitech City Road", phone: "08885095614", spec1: "Gastroenterology", spec2: "Orthopedics" },
    { name: "CARE Hospitals, Banjara Hills", city: "Hyderabad", address: "CARE Hospitals, Road No.1, Banjara Hills", phone: "+91 40 6810 6565", spec1: "Nephrology", spec2: "General Medicine" },
    { name: "Yashoda Hospitals, Secunderabad", city: "Hyderabad", address: "Alexander Road, Secunderabad", phone: "08065906165", spec1: "Oncology", spec2: "Pulmonology" },
    { name: "Citizens Specialty Hospital, Nallagandla", city: "Hyderabad", address: "1-100/1/CCH, Citizens Hospital Rd", phone: "040 6719 1919", spec1: "Paediatrics", spec2: "Dermatology" },
    { name: "Continental Hospitals, Gachibowli", city: "Hyderabad", address: "Plot No 3, Road No.2, Financial District", phone: "+91 40 6700 0000", spec1: "Gynecology", spec2: "ENT" },
    { name: "Sravani Hospitals, Hyderabad", city: "Hyderabad", address: "Plot no 91, Cyber hills, Guttala Begumpet", phone: "+91 91335 01555", spec1: "Cardiology", spec2: "Orthopedics" },
    { name: "KIMS Hospitals Secunderabad", city: "Hyderabad", address: "1-8-31/1, Minister Road, Secunderabad", phone: "040 4488 5000", spec1: "Neurology", spec2: "Transplants" },
    { name: "AIG Hospitals, Gachibowli", city: "Hyderabad", address: "1-66, Mindspace Rd, Gachibowli", phone: "040 4244 4222", spec1: "Gastroenterology", spec2: "Critical Care" },
    { name: "Rainbow Children's Hospital", city: "Hyderabad", address: "Banjara Hills", phone: "040 4969 6969", spec1: "Paediatrics", spec2: "Neonatology" },
    { name: "Sunshine Hospitals, Hyderabad", city: "Hyderabad", address: "Begumpet, Hyderabad", phone: "040 4455 0000", spec1: "Orthopedics", spec2: "Trauma" },
    { name: "Aster Prime Hospitals, Hyderabad", city: "Hyderabad", address: "Plot No 4, Mythrivanam, Ameerpet", phone: "040 4488 9999", spec1: "Internal Medicine", spec2: "Oncology" },
    { name: "Apollo Hospitals, Secunderabad", city: "Hyderabad", address: "Secunderabad", phone: "040-23607777", spec1: "Nephrology", spec2: "Pulmonology" },
    { name: "PACE Hospitals, Madinaguda", city: "Hyderabad", address: "Mythri Nagar, Beside South India Shopping Mall", phone: "040-48486868", spec1: "Urology", spec2: "Physiotherapy" },
    { name: "Apollo TeleHealth Services", city: "Hyderabad", address: "Krishe Sapphire Building, HI-Tech City", phone: "+91 40 2360 7777", spec1: "Telehealth", spec2: "General Medicine" },
    { name: "Yashoda Hospitals Somajiguda", city: "Hyderabad", address: "Rajbhavan Road, Somajiguda", phone: "+91 9513262681", spec1: "Cardiology", spec2: "Orthopedics" },
    { name: "Yashoda Hospitals Malakpet", city: "Hyderabad", address: "Nalgonda X Roads, Malakpet", phone: "+91 9513262681", spec1: "General Surgery", spec2: "Endocrinology" },
    { name: "Yashoda Hospitals Hitech City", city: "Hyderabad", address: "Kothaguda, Hitec City", phone: "+91 9513262681", spec1: "Neurology", spec2: "Rheumatology" }
];

async function seedData() {
    console.log("Starting manual data import via API...");

    // 1. Sign out just in case
    await supabase.auth.signOut();

    // 2. Login or Signup Admin
    const adminEmail = "superadmin_test@kushihygieia.app";
    const adminPass = "admin123";
    let adminUserId;

    const { data: signinData, error: signinErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
    
    if (signinErr || !signinData.user) {
        // Sign up if doesn't exist
        const { data: signupData, error: signupErr } = await supabase.auth.signUp({
            email: adminEmail, password: adminPass, options: { data: { role: 'admin', full_name: 'Super Admin Test' } }
        });
        if (signupErr) { console.error("Admin Auth Error:", signupErr.message); return; }
        adminUserId = signupData?.user?.id;
    } else {
        adminUserId = signinData.user.id;
    }

    if (adminUserId) {
        await supabase.from('admins').upsert({ id: adminUserId, full_name: "Super Admin Test", email: adminEmail, role: "admin" });
        console.log("Admin log in & upsert successful!");
    }

    // 3. Insert Hospitals (while logged in as admin to bypass RLS)
    console.log("Inserting hospitals...");
    const hospitalIdMap = {};
    for (const h of hospitals) {
        const { data: existingH } = await supabase.from('hospitals').select('id').ilike('name', `%${h.name}%`).limit(1);
        if (existingH && existingH.length > 0) {
            hospitalIdMap[h.name] = existingH[0].id;
        } else {
            const { data: newH, error: insErr } = await supabase.from('hospitals').insert({
                name: h.name, city: h.city, address: h.address, phone: h.phone
            }).select('id').single();
            if (insErr) { console.error(`Error inserting hospital ${h.name}:`, insErr.message); }
            else { hospitalIdMap[h.name] = newH.id; }
        }
    }
    console.log("Hospitals complete!");

    // 4. Insert Doctors
    console.log("Inserting doctors...");
    for (let i = 0; i < hospitals.length; i++) {
        const h = hospitals[i];
        const h_id = hospitalIdMap[h.name];
        if (!h_id) continue;

        const docsToCreate = [
            { email: `dr.one.${i}@tester.com`, name: `Dr. First ${h.name.split(' ')[0].replace(',', '')}`, spec: h.spec1 },
            { email: `dr.two.${i}@tester.com`, name: `Dr. Second ${h.name.split(' ')[0].replace(',', '')}`, spec: h.spec2 }
        ];

        for (const doc of docsToCreate) {
            // Sign out current user
            await supabase.auth.signOut();

            let docUserId;
            // Try to log in
            const { data: dIn, error: dInErr } = await supabase.auth.signInWithPassword({ email: doc.email, password: "password123" });
            if (dInErr || !dIn?.user) {
                // Try to sign up
                const { data: dUp, error: dUpErr } = await supabase.auth.signUp({
                    email: doc.email, password: "password123", options: { data: { role: "doctor", full_name: doc.name } }
                });
                if (dUpErr) { console.error(`Failed to auth ${doc.email}:`, dUpErr.message); continue; }
                docUserId = dUp.user.id;
            } else {
                docUserId = dIn.user.id;
            }

            if (docUserId) {
                // Minimal columns to avoid schema mismatch
                const docProfile = {
                    id: docUserId,
                    full_name: doc.name,
                    email: doc.email,
                    role: 'doctor',
                    specialty: doc.spec,
                    hospital_id: h_id,
                    verified: true,
                    registration_no: `REG-${i}-${doc.name.includes('First')?'1':'2'}`
                };
                
                let { error: insD } = await supabase.from('doctors').upsert(docProfile);
                if (insD && insD.code === '42703') { // undefined_column
                    // Try without registration_no
                    delete docProfile.registration_no;
                    const { error: retryErr } = await supabase.from('doctors').upsert(docProfile);
                    if (retryErr) console.error(`Retry error for ${doc.email}:`, retryErr.message);
                } else if (insD) {
                    console.error(`Error inserting doctor ${doc.email}:`, insD.message);
                }
            }
        }
        await new Promise(r => setTimeout(r, 800)); // Sleep briefly to stay under API limits
    }
    
    console.log("Data Import via API completed successfully!");
}

seedData();
