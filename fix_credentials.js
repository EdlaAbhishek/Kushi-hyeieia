import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createFunc() {
    console.log("Creating Test Admin...");
    const adminEmail = "verified_admin@kushihygieia.app";
    const adminPass = "admin123";
    
    // Sign out first
    await supabase.auth.signOut();

    // Sign up Admin
    const { data: adminAuth, error: adminErr } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPass,
        options: {
            data: { role: 'admin', full_name: 'Verified Admin' }
        }
    });

    if (adminErr) {
        if (adminErr.message.includes('already registered')) {
            console.log(`Admin ${adminEmail} already exists. Attempting login to verify...`);
            const { error: loginErr } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPass });
            if (loginErr) console.error("Login failed for existing Admin:", loginErr.message);
            else console.log("Login successful! Admins table will be updated if needed.");
        } else {
            console.error("Admin Auth Error:", adminErr.message);
        }
    } else {
        console.log("Admin account structured properly via Auth API.");
    }

    // Upsert into admins table to grant privileges
    const { data: userSession } = await supabase.auth.getSession();
    const uid = userSession?.session?.user?.id || adminAuth?.user?.id;
    if (uid) {
        const { error: upsertErr } = await supabase.from('admins').upsert({
            id: uid, 
            full_name: "Verified Admin", 
            email: adminEmail, 
            role: "admin"
        });
        if (upsertErr) console.error("Admins table insert error:", upsertErr.message);
        else console.log(`✓ Admin credentials ready: ${adminEmail} / ${adminPass}`);
    }

    console.log("\nCreating Test Doctor...");
    const docEmail = "verified_doc@kushihygieia.app";
    const docPass = "password123";

    await supabase.auth.signOut();

    // Sign up Doctor
    const { data: docAuth, error: docErr } = await supabase.auth.signUp({
        email: docEmail,
        password: docPass,
        options: {
            data: { role: 'doctor', full_name: 'Dr. Verified' }
        }
    });

    if (docErr) {
        if (docErr.message.includes('already registered')) {
            console.log(`Doctor ${docEmail} already exists. Attempting login...`);
            const { error } = await supabase.auth.signInWithPassword({ email: docEmail, password: docPass });
            if (error) console.error("Login failed for existing Doctor:", error.message);
            else console.log("Login successful! Doctor table will be updated if needed.");
        } else {
            console.error("Doctor Auth Error:", docErr.message);
        }
    } else {
        console.log("Doctor account structured properly via Auth API.");
    }

    const { data: dSession } = await supabase.auth.getSession();
    const did = dSession?.session?.user?.id || docAuth?.user?.id;
    
    if (did) {
        // Need to link to a hospital. Pick the first one available
        const { data: hData } = await supabase.from('hospitals').select('id').limit(1);
        const hid = hData && hData.length > 0 ? hData[0].id : null;
        
        if (hid) {
            const { error: dUpsert } = await supabase.from('doctors').upsert({
                id: did,
                specialty: "Cardiology",
                hospital_id: hid,
                verified: true
            });
            if (dUpsert) console.error("Doctor table insert error (might be ignored if RLS blocked):", dUpsert.message);
            else console.log(`✓ Doctor credentials ready: ${docEmail} / ${docPass}`);
        } else {
            console.log(`? Doctor registered, but couldn't associate with a hospital. Registration: ${docEmail} / ${docPass}`);
        }
    }
}

createFunc();
