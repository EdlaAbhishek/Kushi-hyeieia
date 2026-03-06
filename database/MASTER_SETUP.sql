-- =====================================================================
-- MASTER SETUP — Khushi Hygieia Healthcare Platform
-- Run this ENTIRE file in your Supabase SQL Editor
-- ✅ FULLY IDEMPOTENT — safe to run multiple times
-- =====================================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: CORE TABLES
-- ══════════════════════════════════════════════════════════════

-- 1a. Patients (maps to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.patients (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    age         INTEGER,
    gender      TEXT,
    phone       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     TEXT        NOT NULL,
    lat         NUMERIC(10, 7),
    lng         NUMERIC(10, 7),
    phone       VARCHAR(20),
    emergency   BOOLEAN     NOT NULL DEFAULT FALSE,
    rating      NUMERIC(2,1) DEFAULT 4.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1c. Doctors (maps to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.doctors (
    id                          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id                     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name                   VARCHAR(120) NOT NULL,
    email                       VARCHAR(200) NOT NULL UNIQUE,
    specialty                   VARCHAR(100),
    hospital_id                 UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    hospital_name               VARCHAR(200),
    bio                         TEXT,
    profile_photo               TEXT,
    avatar_url                  TEXT,
    verified                    BOOLEAN NOT NULL DEFAULT FALSE,
    available                   BOOLEAN NOT NULL DEFAULT TRUE,
    teleconsultation_available  BOOLEAN NOT NULL DEFAULT FALSE,
    role                        VARCHAR(20) DEFAULT 'doctor',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If doctors table already existed from an older migration, add missing columns:
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='hospital_id') THEN
        ALTER TABLE public.doctors ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='hospital_name') THEN
        ALTER TABLE public.doctors ADD COLUMN hospital_name VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='bio') THEN
        ALTER TABLE public.doctors ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='profile_photo') THEN
        ALTER TABLE public.doctors ADD COLUMN profile_photo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='avatar_url') THEN
        ALTER TABLE public.doctors ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='teleconsultation_available') THEN
        ALTER TABLE public.doctors ADD COLUMN teleconsultation_available BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 1d. Appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id       UUID        NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id     UUID        REFERENCES public.hospitals(id) ON DELETE SET NULL,
    appointment_date DATE,
    scheduled_at    TIMESTAMPTZ,
    type            VARCHAR(20) NOT NULL DEFAULT 'in-person'
                        CHECK (type IN ('in-person', 'telehealth')),
    status          VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    urgency         VARCHAR(20) DEFAULT 'Routine',
    symptoms        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1e. Emergency Logs
CREATE TABLE IF NOT EXISTS public.emergency_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    lat          NUMERIC(10, 7),
    lng          NUMERIC(10, 7),
    trigger_type VARCHAR(50),
    resolved     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1f. AI Chat Sessions
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    messages   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: PHASE 3 — RURAL VITALS (Health Worker Mode)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.vitals (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name    VARCHAR(100) NOT NULL,
    patient_phone   VARCHAR(20),
    village_name    VARCHAR(100),
    blood_pressure  VARCHAR(20),
    heart_rate      INTEGER,
    spo2            INTEGER,
    temperature     DECIMAL(4,1),
    blood_glucose   INTEGER,
    notes           TEXT,
    entered_by      UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- SECTION 3: COMMUNITY & SOCIAL FEATURES
-- ══════════════════════════════════════════════════════════════

-- 3a. Global Community Chat
CREATE TABLE IF NOT EXISTS public.global_messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name  TEXT        NOT NULL,
    user_role  TEXT        DEFAULT 'patient',
    content    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3b. Blood Donors
CREATE TABLE IF NOT EXISTS public.blood_donors (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT        NOT NULL,
    blood_group     TEXT        NOT NULL,
    location        TEXT        NOT NULL,
    phone           TEXT        NOT NULL,
    show_name       BOOLEAN     DEFAULT TRUE,
    contact_visible BOOLEAN     DEFAULT FALSE,
    available_until DATE        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3c. Blood Requests
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id       UUID        NOT NULL REFERENCES public.blood_donors(id) ON DELETE CASCADE,
    patient_name   TEXT        NOT NULL,
    patient_phone  TEXT        NOT NULL,
    message        TEXT,
    status         TEXT        DEFAULT 'pending',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3d. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message     TEXT        NOT NULL,
    type        TEXT        NOT NULL,
    read_status BOOLEAN     DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_appointments_patient   ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor    ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_schedule  ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_date      ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty      ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_hospitals_city         ON public.hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_emergency    ON public.hospitals(emergency) WHERE emergency = TRUE;
CREATE INDEX IF NOT EXISTS idx_global_messages_time   ON public.global_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_entered_by      ON public.vitals(entered_by);


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_donors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions  ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: RLS POLICIES — Clean & recreate
-- ══════════════════════════════════════════════════════════════

-- ── PATIENTS ──
DROP POLICY IF EXISTS "Allow inserts for signup"          ON public.patients;
DROP POLICY IF EXISTS "Allow anon inserts for signup"     ON public.patients;
DROP POLICY IF EXISTS "Users can read their own profile"  ON public.patients;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.patients;

CREATE POLICY "Allow inserts for signup"
    ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read their own profile"
    ON public.patients FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile"
    ON public.patients FOR UPDATE USING (auth.uid() = id);


-- ── DOCTORS ──
DROP POLICY IF EXISTS "Allow inserts for signup"          ON public.doctors;
DROP POLICY IF EXISTS "Allow anon inserts for signup"     ON public.doctors;
DROP POLICY IF EXISTS "Anyone can view doctors"           ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctors;

CREATE POLICY "Allow inserts for signup"
    ON public.doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view doctors"
    ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors can update their own profile"
    ON public.doctors FOR UPDATE USING (auth.uid() = id);


-- ── HOSPITALS ──
DROP POLICY IF EXISTS "Anyone can view hospitals"         ON public.hospitals;

CREATE POLICY "Anyone can view hospitals"
    ON public.hospitals FOR SELECT USING (true);


-- ── APPOINTMENTS ──
DROP POLICY IF EXISTS "Users can book appointments"       ON public.appointments;
DROP POLICY IF EXISTS "View own appointments"             ON public.appointments;
DROP POLICY IF EXISTS "Update own appointments"           ON public.appointments;

CREATE POLICY "Users can book appointments"
    ON public.appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "View own appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Update own appointments"
    ON public.appointments FOR UPDATE
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);


-- ── VITALS ──
DROP POLICY IF EXISTS "Health workers can insert vitals"  ON public.vitals;
DROP POLICY IF EXISTS "Health workers can view vitals"    ON public.vitals;

CREATE POLICY "Health workers can insert vitals"
    ON public.vitals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Health workers can view vitals"
    ON public.vitals FOR SELECT USING (auth.role() = 'authenticated');


-- ── GLOBAL MESSAGES ──
DROP POLICY IF EXISTS "Anyone can read global messages"          ON public.global_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages"    ON public.global_messages;

CREATE POLICY "Anyone can read global messages"
    ON public.global_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages"
    ON public.global_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ── BLOOD DONORS ──
DROP POLICY IF EXISTS "Anyone can read blood donors"          ON public.blood_donors;
DROP POLICY IF EXISTS "Users can manage own donor profile"    ON public.blood_donors;

CREATE POLICY "Anyone can read blood donors"
    ON public.blood_donors FOR SELECT USING (true);
CREATE POLICY "Users can manage own donor profile"
    ON public.blood_donors FOR ALL USING (auth.uid() = user_id);


-- ── BLOOD REQUESTS ──
DROP POLICY IF EXISTS "Anyone can read blood requests"                  ON public.blood_requests;
DROP POLICY IF EXISTS "Authenticated users can create blood requests"   ON public.blood_requests;

CREATE POLICY "Anyone can read blood requests"
    ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create blood requests"
    ON public.blood_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ── NOTIFICATIONS ──
DROP POLICY IF EXISTS "Users can read own notifications"       ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"     ON public.notifications;

CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert notifications"
    ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);


-- ── EMERGENCY LOGS ──
DROP POLICY IF EXISTS "Authenticated users can log emergencies" ON public.emergency_logs;
DROP POLICY IF EXISTS "Users can view own emergency logs"       ON public.emergency_logs;

CREATE POLICY "Authenticated users can log emergencies"
    ON public.emergency_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own emergency logs"
    ON public.emergency_logs FOR SELECT USING (auth.uid() = user_id);


-- ── CHAT SESSIONS ──
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can manage own chat sessions"
    ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- SECTION 7: STORAGE BUCKET (Avatars / Profile Photos)
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access"    ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update Access" ON storage.objects;

CREATE POLICY "Public Access"
    ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth Insert Access"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Access"
    ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');


-- ══════════════════════════════════════════════════════════════
-- SECTION 8: SAMPLE HOSPITAL DATA (Hyderabad / Secunderabad)
-- ══════════════════════════════════════════════════════════════
-- Clears old sample data and inserts Hyderabad-area hospitals.

DELETE FROM public.hospitals;

INSERT INTO public.hospitals (name, city, address, lat, lng, phone, emergency, rating) VALUES
    ('KIMS Hospital',                  'Secunderabad', 'Minister Road, Secunderabad',                   17.4411, 78.4984, '040-44885000', TRUE,  4.5),
    ('Yashoda Hospitals',              'Secunderabad', 'Raj Bhavan Road, Somajiguda',                   17.4370, 78.4680, '040-45674567', TRUE,  4.6),
    ('Gandhi Hospital',                'Secunderabad', 'Musheerabad, Secunderabad',                     17.3950, 78.4983, '040-27505566', TRUE,  4.3),
    ('Care Hospitals',                 'Hyderabad',    'Road No. 1, Banjara Hills',                     17.4156, 78.4488, '040-30418888', TRUE,  4.7),
    ('Apollo Hospitals Jubilee Hills', 'Hyderabad',    'Jubilee Hills, Hyderabad',                      17.4260, 78.4075, '040-23607777', TRUE,  4.8),
    ('Osmania General Hospital',       'Hyderabad',    'Afzal Gunj, Hyderabad',                         17.3688, 78.4745, '040-24600146', TRUE,  4.2),
    ('Nizam''s Institute (NIMS)',      'Hyderabad',    'Punjagutta, Hyderabad',                         17.4295, 78.4500, '040-23489000', TRUE,  4.6),
    ('Continental Hospitals',          'Hyderabad',    'Gachibowli, Hyderabad',                         17.4401, 78.3489, '040-67000000', TRUE,  4.5),
    ('AIG Hospitals',                  'Hyderabad',    'Mindspace Road, Gachibowli',                    17.4375, 78.3580, '040-42444222', TRUE,  4.7),
    ('Sunshine Hospitals',             'Secunderabad', 'PG Road, Secunderabad',                         17.4400, 78.4990, '040-44440000', TRUE,  4.4),
    ('Basavatarakam Cancer Hospital',  'Hyderabad',    'Road No. 10, Banjara Hills',                    17.4197, 78.4411, '040-23551235', TRUE,  4.8),
    ('Star Hospitals',                 'Hyderabad',    '8-2-596/5, Road No. 10, Banjara Hills',         17.4185, 78.4420, '040-44777777', TRUE,  4.6),
    ('Mythri Hospital',                'Medchal',      'Medchal Road, Medchal',                         17.6298, 78.4812, '040-27902222', TRUE,  4.3),
    ('Srikara Hospitals',              'Medchal',      'NH-44, Medchal, Hyderabad',                     17.6350, 78.4830, '040-29702222', TRUE,  4.4),
    ('Aware Global Hospital',          'Hyderabad',    'Chirag Ali Lane, Abids',                        17.5920, 78.4750, '040-44556677', TRUE,  4.5),
    ('Prathima Hospitals',             'Kompally',     'Kompally Main Road, Secunderabad',              17.5400, 78.4860, '040-27164646', TRUE,  4.4),
    ('MaxCure Hospitals',              'Alwal',        'Alwal X Road, Secunderabad',                    17.5095, 78.5100, '040-49692777', TRUE,  4.5),
    ('CMR Hospital',                   'Kandlakoya',   'CMR Campus, Medchal Road',                      17.6045, 78.4865, '08418-200200', TRUE,  4.2),
    ('Sureka Hospital',                'Medchal',      'Near Bus Stand, Medchal',                       17.6250, 78.4810, '08418-222111', TRUE,  4.1),
    ('GVK EMRI Hospital',              'Devar Yamjal', 'Medchal Road, Secunderabad',                    17.5610, 78.5020, '040-23462222', TRUE,  4.5);



-- ══════════════════════════════════════════════════════════════
-- SECTION 9: REALTIME (needed for Community Chat)
-- ══════════════════════════════════════════════════════════════
-- After running this SQL, go to:
--   Supabase Dashboard → Database → Replication → global_messages → Enable
-- This is required for the live community chat to work.

-- ══════════════════════════════════════════════════════════════
-- SECTION 10: POPULATION HEALTH DASHBOARD DATA
-- ══════════════════════════════════════════════════════════════

-- Create risk_scores table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'risk_scores') THEN
        CREATE TABLE public.risk_scores (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID REFERENCES auth.users(id),
            risk_type VARCHAR(50) NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            assessed_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Public can view risk scores" ON public.risk_scores;
        CREATE POLICY "Public can view risk scores"
            ON public.risk_scores FOR SELECT
            USING (true);

        -- Insert Sample Data for Risk Scores
        INSERT INTO public.risk_scores (patient_id, risk_type, score) VALUES
        (NULL, 'Healthy', 20), (NULL, 'Healthy', 15), (NULL, 'Healthy', 30),
        (NULL, 'Diabetic', 85), (NULL, 'Diabetic', 75), (NULL, 'Diabetic', 90),
        (NULL, 'Hypertension', 80), (NULL, 'Hypertension', 72), (NULL, 'Hypertension', 88),
        (NULL, 'Cardiac Risk', 95), (NULL, 'Cardiac Risk', 82), (NULL, 'Cardiac Risk', 91),
        (NULL, 'Respiratory', 65), (NULL, 'Respiratory', 70), (NULL, 'Respiratory', 85),
        (NULL, 'Healthy', 10), (NULL, 'Healthy', 25), (NULL, 'Healthy', 40),
        (NULL, 'Diabetic', 92), (NULL, 'Diabetic', 78), (NULL, 'Diabetic', 81),
        (NULL, 'Hypertension', 86), (NULL, 'Hypertension', 79), (NULL, 'Hypertension', 93),
        (NULL, 'Cardiac Risk', 89), (NULL, 'Cardiac Risk', 94), (NULL, 'Cardiac Risk', 87),
        (NULL, 'Respiratory', 75), (NULL, 'Respiratory', 82), (NULL, 'Respiratory', 77);
    END IF;
END $$;

-- Create triage_cases table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'triage_cases') THEN
        CREATE TABLE public.triage_cases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID REFERENCES auth.users(id),
            urgency VARCHAR(20) DEFAULT 'Routine',
            symptoms TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE public.triage_cases ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Public can view triage cases" ON public.triage_cases;
        CREATE POLICY "Public can view triage cases"
            ON public.triage_cases FOR SELECT
            USING (true);

        -- Insert Sample Data for Triage Cases
        INSERT INTO public.triage_cases (patient_id, urgency, symptoms) VALUES
        (NULL, 'Routine', 'Mild headache and fatigue'),
        (NULL, 'Routine', 'Annual checkup requested'),
        (NULL, 'Routine', 'Slight cough for 2 days'),
        (NULL, 'Urgent', 'High fever and chills'),
        (NULL, 'Urgent', 'Severe stomach pain'),
        (NULL, 'Urgent', 'Difficulty breathing while walking'),
        (NULL, 'Emergency', 'Chest pain radiating to arm'),
        (NULL, 'Emergency', 'Sudden numbness in face and arm'),
        (NULL, 'Routine', 'Refill prescription'),
        (NULL, 'Routine', 'Joint pain in knee'),
        (NULL, 'Routine', 'Mild allergic reaction'),
        (NULL, 'Urgent', 'Suspected dehydration'),
        (NULL, 'Urgent', 'Deep cut requiring stitches'),
        (NULL, 'Urgent', 'Persistent vomiting'),
        (NULL, 'Emergency', 'Unconscious patient'),
        (NULL, 'Emergency', 'Severe breathing difficulty'),
        (NULL, 'Routine', 'Earache'),
        (NULL, 'Routine', 'Sore throat'),
        (NULL, 'Routine', 'Mild back pain'),
        (NULL, 'Urgent', 'High blood pressure reading'),
        (NULL, 'Urgent', 'Severe migraine'),
        (NULL, 'Urgent', 'Asthma exacerbation'),
        (NULL, 'Emergency', 'Suspected stroke'),
        (NULL, 'Emergency', 'Severe trauma from fall'),
        (NULL, 'Routine', 'Follow-up appointment'),
        (NULL, 'Routine', 'Mild skin rash'),
        (NULL, 'Routine', 'Dietary consultation'),
        (NULL, 'Urgent', 'Palpitations'),
        (NULL, 'Urgent', 'Sudden vision changes'),
        (NULL, 'Emergency', 'Anaphylactic shock');

        -- 32. Create Doctor Applications Table
        CREATE TABLE IF NOT EXISTS public.doctor_applications (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            specialization TEXT NOT NULL,
            experience_years INTEGER NOT NULL,
            license_number TEXT NOT NULL,
            hospital_affiliation TEXT,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Add RLS to doctor_applications
        ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own applications" ON public.doctor_applications;
        CREATE POLICY "Users can view own applications"
            ON public.doctor_applications FOR SELECT
            USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can insert own applications" ON public.doctor_applications;
        CREATE POLICY "Users can insert own applications"
            ON public.doctor_applications FOR INSERT
            WITH CHECK (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Public can view applications" ON public.doctor_applications;
        CREATE POLICY "Public can view applications"
            ON public.doctor_applications FOR SELECT
            USING (true);

    END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- DONE! All tables, policies, indexes, and sample data created.
-- ══════════════════════════════════════════════════════════════
