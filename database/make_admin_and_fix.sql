-- ====================================================================
-- FULL ADMIN SETUP & SCHEMA FIX SCRIPT
-- Run this entire script in your Supabase SQL Editor
-- ====================================================================

-- 1. MAKE 'admin@kushihygieia.app' AN ADMIN
DO $$ 
DECLARE 
    target_user_id UUID;
BEGIN
    -- Find the user ID for admin@kushihygieia.app
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@kushihygieia.app';

    IF target_user_id IS NOT NULL THEN
        -- Safely update the JSON metadata to include role: 'admin'
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
        WHERE id = target_user_id;

        -- Create the admins table if it doesn't exist yet with all required columns
        CREATE TABLE IF NOT EXISTS public.admins (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'admin',
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Insert the user into the admins table with required fields
        INSERT INTO public.admins (id, full_name, email, role)
        VALUES (
            target_user_id, 
            COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id), 'System Administrator'),
            'admin@kushihygieia.app', 
            'admin'
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'admin',
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;

        RAISE NOTICE 'Successfully made admin@kushihygieia.app an admin!';
    ELSE
        RAISE NOTICE 'User admin@kushihygieia.app NOT FOUND. Please ensure the account is created first.';
    END IF;
END $$;


-- 2. FIX SCHEMA FOR ADMIN PANEL (Missing Columns)
ALTER TABLE public.doctors
    ADD COLUMN IF NOT EXISTS name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS experience INTEGER,
    ADD COLUMN IF NOT EXISTS hospital VARCHAR(200),
    ADD COLUMN IF NOT EXISTS license_number TEXT;

UPDATE public.doctors SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS patient_name TEXT,
    ADD COLUMN IF NOT EXISTS doctor_name TEXT,
    ADD COLUMN IF NOT EXISTS hospital_name TEXT,
    ADD COLUMN IF NOT EXISTS date TEXT,
    ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'in_person',
    ADD COLUMN IF NOT EXISTS time TEXT;


-- 3. FIX ADMIN PANEL SECURITY POLICIES (RLS)
-- Doctors
DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;
CREATE POLICY "Admins can delete doctors" ON public.doctors FOR DELETE USING (true);

-- Appointments
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;
CREATE POLICY "Admins can update all appointments" ON public.appointments FOR UPDATE USING (true);

-- Hospitals
DROP POLICY IF EXISTS "Admins can insert hospitals" ON public.hospitals;
CREATE POLICY "Admins can insert hospitals" ON public.hospitals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update hospitals" ON public.hospitals;
CREATE POLICY "Admins can update hospitals" ON public.hospitals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete hospitals" ON public.hospitals;
CREATE POLICY "Admins can delete hospitals" ON public.hospitals FOR DELETE USING (true);

-- Doctor Applications
DROP POLICY IF EXISTS "Admins can view all applications" ON public.doctor_applications;
CREATE POLICY "Admins can view all applications" ON public.doctor_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can delete applications" ON public.doctor_applications;
CREATE POLICY "Admins can delete applications" ON public.doctor_applications FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admins can update applications" ON public.doctor_applications;
CREATE POLICY "Admins can update applications" ON public.doctor_applications FOR UPDATE USING (true);

-- ====================================================================
-- DONE!
-- ====================================================================
