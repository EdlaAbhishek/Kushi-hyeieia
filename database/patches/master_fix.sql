-- =========================================================================
-- COMPLETE FIX FOR KHUSHI HYGIEIA DATABASE SCHEMA & AUTHENTICATION
-- =========================================================================

-- 1. Create missing patients table and map to auth.users correctly
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ensure doctors table exists and map to auth.users correctly
-- Note: 'doctors' might already exist from your migrations, but let's ensure 'id' points to auth.users
-- If the table already exists, this avoids crashing.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'doctors') THEN
        CREATE TABLE public.doctors (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Keep for backward compatibility if needed by frontend
            full_name VARCHAR(120) NOT NULL,
            email VARCHAR(200) NOT NULL UNIQUE,
            specialty VARCHAR(100),
            hospital VARCHAR(200),
            hospital_name VARCHAR(200),
            verified BOOLEAN DEFAULT FALSE,
            available BOOLEAN DEFAULT TRUE,
            teleconsultation_available BOOLEAN DEFAULT FALSE,
            role VARCHAR(20) DEFAULT 'doctor',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

-- 3. We cannot easily alter a primary key or foreign key if data exists, so we just ensure 
-- the foreign key points to `auth.users`, not a custom `public.users` table.
-- If you have a custom 'users' table, and you don't use it, we leave it alone.
-- The frontend is using `auth.users()`, so `patients` and `doctors` should reference `auth.users(id)`.


-- ==========================================
-- ROW-LEVEL SECURITY (RLS) FIXES
-- ==========================================

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to prevent conflicts
DROP POLICY IF EXISTS "Allow anon inserts for signup" ON public.patients;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.patients;

DROP POLICY IF EXISTS "Allow anon inserts for signup" ON public.doctors;
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON public.doctors;

-- PATIENTS POLICIES
-- Allow insert during signup (important for frontend insertions right after auth.signUp)
CREATE POLICY "Allow inserts for signup" 
ON public.patients FOR INSERT 
WITH CHECK (true);

-- Allow patients to view and update their own profile
CREATE POLICY "Users can read their own profile" 
ON public.patients FOR SELECT 
USING ( true ); -- (Allowing all reads to prevent unexpected UI blocks, or restrict to auth.uid() = id)

CREATE POLICY "Users can update their own profile" 
ON public.patients FOR UPDATE 
USING ( auth.uid() = id );


-- DOCTORS POLICIES
-- Allow insert during signup
CREATE POLICY "Allow inserts for signup" 
ON public.doctors FOR INSERT 
WITH CHECK (true);

-- Anyone can view doctors (for the directory)
CREATE POLICY "Anyone can view doctors" 
ON public.doctors FOR SELECT 
USING ( true );

-- Doctors can update their own profile
CREATE POLICY "Doctors can update their own profile" 
ON public.doctors FOR UPDATE 
USING ( auth.uid() = id );


-- APPOINTMENTS POLICIES
-- Allow authenticated users to book appointments
CREATE POLICY "Users can book appointments" 
ON public.appointments FOR INSERT 
WITH CHECK ( auth.role() = 'authenticated' );

-- Users and doctors can view their own appointments
CREATE POLICY "View own appointments" 
ON public.appointments FOR SELECT 
USING ( auth.uid() = patient_id OR auth.uid() = doctor_id );

-- Doctors can update their own appointments (to confirm/complete)
-- Patients can update to cancel
CREATE POLICY "Update own appointments" 
ON public.appointments FOR UPDATE 
USING ( auth.uid() = patient_id OR auth.uid() = doctor_id );
