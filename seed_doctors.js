import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'; // Requires npm install dotenv

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const generateUUID = () => crypto.randomUUID();

const mockDoctors = [
    {
        email: "dr.ananya.sharma@example.com",
        password: "Password123!",
        full_name: "Dr. Ananya Sharma",
        specialty: "Cardiology",
        hospital_name: "Apollo Hospitals, Jubilee Hills",
        verified: true,
        teleconsultation_available: true,
        available: true,
        bio: "Senior Cardiologist with 15+ years of experience in interventional cardiology and heart failure management.",
        profile_photo: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
        email: "dr.vikram.reddy@example.com",
        password: "Password123!",
        full_name: "Dr. Vikram Reddy",
        specialty: "Neurology",
        hospital_name: "Apollo Hospitals, Jubilee Hills",
        verified: true,
        teleconsultation_available: false,
        available: false,
        bio: "Expert in neurophysiology and treating movement disorders, stroke, and epilepsy.",
        profile_photo: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
        email: "dr.priya.desai@example.com",
        password: "Password123!",
        full_name: "Dr. Priya Desai",
        specialty: "Pediatrics",
        hospital_name: "CARE Hospitals, Banjara Hills",
        verified: true,
        teleconsultation_available: true,
        available: true,
        bio: "Compassionate pediatrician specializing in newborn care, vaccinations, and child development.",
        profile_photo: "https://randomuser.me/api/portraits/women/68.jpg"
    },
    {
        email: "dr.rahul.verma@example.com",
        password: "Password123!",
        full_name: "Dr. Rahul Verma",
        specialty: "Orthopedics",
        hospital_name: "PACE Hospitals, HITEC City",
        verified: true,
        teleconsultation_available: true,
        available: false,
        bio: "Renowned orthopedic surgeon specializing in joint replacement and sports injuries.",
        profile_photo: "https://randomuser.me/api/portraits/men/85.jpg"
    },
    {
        email: "dr.sneha.rao@example.com",
        password: "Password123!",
        full_name: "Dr. Sneha Rao",
        specialty: "Dermatology",
        hospital_name: "Yashoda Hospitals, Secunderabad",
        verified: true,
        teleconsultation_available: true,
        available: true,
        bio: "Expert dermatologist providing advanced clinical and cosmetic skin care solutions.",
        profile_photo: "https://randomuser.me/api/portraits/women/12.jpg"
    },
    {
        email: "dr.arjun.patel@example.com",
        password: "Password123!",
        full_name: "Dr. Arjun Patel",
        specialty: "General Medicine",
        hospital_name: "KIMS Hospitals, Secunderabad",
        verified: true,
        teleconsultation_available: true,
        available: true,
        bio: "Specializes in diagnosing and treating adult diseases with a focus on preventative care.",
        profile_photo: "https://randomuser.me/api/portraits/men/54.jpg"
    }
];

async function seedDoctors() {
    console.log('Fetching hospitals to map hospital_id...');
    const { data: hospitals, error: hError } = await supabase.from('hospitals').select('id, name');
    
    if (hError) {
        console.error('Error fetching hospitals:', hError);
        return;
    }

    console.log(`Starting to insert ${mockDoctors.length} doctors...`);
    
    for (const doc of mockDoctors) {
        console.log(`Processing ${doc.full_name}...`);
        
        // 1. Sign up the doctor to create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: doc.email,
            password: doc.password
        });

        if (authError) {
            console.error(`Auth Error for ${doc.email}:`, authError.message);
            if (authError.message.includes('User already registered')) {
                console.log(`User ${doc.email} exists, skipping creation or you may need to delete them first.`);
            }
            continue;
        }

        const userId = authData?.user?.id;
        if (!userId) {
            console.error('Failed to get user ID after sign up for:', doc.email);
            continue;
        }

        const hospital = hospitals.find(h => h.name === doc.hospital_name);

        const doctorProfile = {
            id: userId,
            user_id: userId,
            email: doc.email,
            full_name: doc.full_name,
            specialty: doc.specialty,
            hospital_id: hospital ? hospital.id : null,
            hospital_name: doc.hospital_name,
            bio: doc.bio,
            profile_photo: doc.profile_photo,
            avatar_url: doc.profile_photo,
            verified: doc.verified,
            available: doc.available,
            teleconsultation_available: doc.teleconsultation_available,
            role: 'doctor'
        };

        const { error: insertError } = await supabase
            .from('doctors')
            .upsert(doctorProfile);

        if (insertError) {
            console.error(`Error inserting profile for ${doc.full_name}:`, insertError);
        } else {
            console.log(`Successfully created doctor profile for ${doc.full_name}`);
        }
    }
    console.log('Finished seeding doctors!');
}

seedDoctors();
