import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data: dIn, error: dInErr } = await supabase.auth.signInWithPassword({ email: "admin@kushihygieia.app", password: "admin123" });
    if (dIn?.session) console.log("SUCCESS: admin@kushihygieia.app logged in successfully!");
    else console.log("Admin login failed:", dInErr?.message);

    const { data: dIn2, error: dInErr2 } = await supabase.auth.signInWithPassword({ email: "doctor@kushihygieia.app", password: "password123" });
    if (dIn2?.session) console.log("SUCCESS: doctor@kushihygieia.app logged in successfully!");
    else console.log("Doctor login failed:", dInErr2?.message);
}
check();
