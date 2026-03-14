-- =====================================================================
-- HACKATHON DATABASE RESET SCRIPT
-- WARNING: This script will DROP the specified tables and DELETE ALL DATA.
-- It recreates the tables exactly as requested, empty and ready for import.
-- =====================================================================

-- 1. DROP EXISTING TABLES (in correct dependency order)
DROP TABLE IF EXISTS public.workflow_logs CASCADE;
DROP TABLE IF EXISTS public.vitals_history CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.health_reports CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.hospitals CASCADE;

-- 2. CREATE TABLES

-- Hospitals
CREATE TABLE public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    address TEXT,
    lat NUMERIC(10, 7),
    lng NUMERIC(10, 7),
    phone TEXT,
    emergency BOOLEAN DEFAULT FALSE,
    rating NUMERIC(2,1) DEFAULT 4.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients (Relaxed FK for Dataset Injection)
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    role TEXT DEFAULT 'patient',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors (Relaxed FK for Dataset Injection)
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    specialty TEXT,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    hospital_name TEXT,
    bio TEXT,
    profile_photo TEXT,
    avatar_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    available BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'doctor',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    appointment_date DATE,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    type TEXT DEFAULT 'in-person' CHECK (type IN ('in-person', 'telehealth')),
    urgency TEXT DEFAULT 'Routine',
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Reports
CREATE TABLE public.health_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_url TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Records
CREATE TABLE public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    record_type TEXT DEFAULT 'other',
    sensitive BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vitals History
CREATE TABLE public.vitals_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    blood_pressure TEXT,
    heart_rate INTEGER,
    spo2 INTEGER,
    temperature NUMERIC(4,1),
    blood_sugar INTEGER,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    entered_by UUID
);

-- Workflow Logs
CREATE TABLE public.workflow_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_logs ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES

-- Hospitals: Public read
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);

-- Patients: Read own, Doctors/Admin read all
CREATE POLICY "Patients read own" ON public.patients FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.patients p2 WHERE p2.id = auth.uid() AND p2.role = 'admin')
);
CREATE POLICY "Patients insert signup" ON public.patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Patients update own" ON public.patients FOR UPDATE USING (auth.uid() = id);

-- Doctors: Public read, Update own
CREATE POLICY "Public read doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Doctors insert signup" ON public.doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Doctors update own" ON public.doctors FOR UPDATE USING (auth.uid() = id);

-- Appointments: Read own (patient/doctor), admin reads all
CREATE POLICY "Read own appointments" ON public.appointments FOR SELECT USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Insert appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = patient_id OR auth.uid() = doctor_id);
CREATE POLICY "Update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Health Reports & Medical Records
CREATE POLICY "Patient manage health reports" ON public.health_reports FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctor read health reports" ON public.health_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Patient manage medical records" ON public.medical_records FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Doctor read medical records" ON public.medical_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);

-- Vitals History
CREATE POLICY "Health worker insert vitals" ON public.vitals_history FOR INSERT WITH CHECK (auth.uid() = entered_by OR auth.uid() = patient_id);
CREATE POLICY "Read vitals history" ON public.vitals_history FOR SELECT USING (
    auth.uid() = patient_id
    OR auth.uid() = entered_by
    OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role IN ('admin', 'health_worker'))
);

-- Workflow Logs
CREATE POLICY "Insert workflow logs" ON public.workflow_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Read workflow logs" ON public.workflow_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
);
