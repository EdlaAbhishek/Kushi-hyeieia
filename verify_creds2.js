import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need the service role key to forcefully update a password
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDoc() {
    // 1. Sign out 
    await supabase.auth.signOut();
    
    // 2. Try to just log in as the doctor first
    const { data: dIn, error: dInErr } = await supabase.auth.signInWithPassword({ 
        email: "doctor@kushihygieia.app", 
        password: "password123" 
    });
    
    if (dIn?.session) {
        console.log("WAIT, Doctor logged in fine this time!");
        return;
    }
    
    console.log("Doctor login failed:", dInErr?.message, "Attempting to properly create/reset via Auth API...");

    // 3. The SQL might have partially created it. Let's try signing up *again* with the API
    const { data: docAuth, error: docErr } = await supabase.auth.signUp({
        email: "doctor@kushihygieia.app",
        password: "password123",
        options: {
            data: { role: 'doctor', full_name: 'Test Doctor' }
        }
    });
    
    if (docErr && docErr.message.includes('already registered')) {
         // It exists, but password doesn't work. We might need the user to run SQL to fix the password, or just make a NEW doctor email.
         console.log("It exists but password failed. Creating a brand new email email: verified_doctor@kushihygieia.app");
         
         const newEmail = "verified_doctor@kushihygieia.app";
         const { data: docAuth2, error: docErr2 } = await supabase.auth.signUp({
            email: newEmail,
            password: "password123",
            options: { data: { role: 'doctor', full_name: 'Dr. Verified' } }
         });
         
         if (docErr2 && !docErr2.message.includes('already registered')) {
             console.error("Failed to create new doctor:", docErr2.message);
         } else {
             // Let's log in to verify
             const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: newEmail, password: "password123" });
             if (verifyErr) {
                 console.log("Failed to verify the newly created doctor too...", verifyErr.message);
             } else {
                 console.log(`SUCCESS: Brand new doctor created and verified: ${newEmail} / password123`);
                 
                 // Try to give them a hospital
                 const { data: dSess } = await supabase.auth.getSession();
                 if (dSess?.session?.user?.id) {
                     const { data: hData } = await supabase.from('hospitals').select('id').limit(1);
                     if (hData && hData.length > 0) {
                         await supabase.from('doctors').upsert({
                             id: dSess.session.user.id,
                             specialty: "Cardiology",
                             hospital_id: hData[0].id,
                             verified: true,
                             full_name: "Dr. Verified",
                             email: newEmail,
                             role: 'doctor'
                         });
                         console.log("Doctor profile linked to hospital.");
                     }
                 }
             }
         }
    } else if (docAuth?.user) {
        console.log("Doctor created successfully via Auth API! Email: doctor@kushihygieia.app / password123");
    }
}

fixDoc();
