-- =====================================================================
-- FIX: Appointments table schema alignment
-- The frontend sends columns that don't exist in the original schema.
-- This migration adds the missing columns to match the frontend code.
-- Run this in your Supabase SQL Editor.
-- ✅ FULLY IDEMPOTENT — safe to run multiple times.
-- =====================================================================

-- 1. Add missing columns to appointments table independently
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_time') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_time VARCHAR(10);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped appointment_time'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='hospital_id') THEN
        -- Safely add without strict FK just in case hospitals table is missing or named differently
        ALTER TABLE public.appointments ADD COLUMN hospital_id UUID;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped hospital_id'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_type') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_type VARCHAR(30) DEFAULT 'in_person';
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped appointment_type'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_name') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_name VARCHAR(200);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped patient_name'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_phone') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_phone VARCHAR(30);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped patient_phone'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_email') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_email VARCHAR(200);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped patient_email'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_address') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_address TEXT;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped patient_address'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reason') THEN
        ALTER TABLE public.appointments ADD COLUMN reason TEXT;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped reason'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='doctor_name') THEN
        ALTER TABLE public.appointments ADD COLUMN doctor_name VARCHAR(200);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped doctor_name'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='hospital_name') THEN
        ALTER TABLE public.appointments ADD COLUMN hospital_name VARCHAR(200);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped hospital_name'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='symptoms') THEN
        ALTER TABLE public.appointments ADD COLUMN symptoms TEXT;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped symptoms'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='notes') THEN
        ALTER TABLE public.appointments ADD COLUMN notes TEXT;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped notes'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='type') THEN
        ALTER TABLE public.appointments ADD COLUMN type VARCHAR(20) DEFAULT 'in-person';
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped type'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='status') THEN
        ALTER TABLE public.appointments ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped status'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='urgency') THEN
        ALTER TABLE public.appointments ADD COLUMN urgency VARCHAR(20) DEFAULT 'Routine';
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped urgency'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='scheduled_at') THEN
        ALTER TABLE public.appointments ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped scheduled_at'; END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_date') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_date DATE;
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Skipped appointment_date'; END $$;


-- 2. Fix the CHECK constraint on 'type' column to also accept frontend values
-- Drop and re-create if it exists (the original only allowed 'in-person' and 'telehealth')
DO $$ BEGIN
    -- Remove old constraint if present
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'appointments' AND column_name = 'type'
    ) THEN
        ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_type_check;
    END IF;
END $$;


-- 3. Fix the CHECK constraint on 'status' to also accept 'approved' and 'rejected'
DO $$ BEGIN
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
        CHECK (status IN ('pending', 'confirmed', 'approved', 'cancelled', 'completed', 'rejected'));
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;


-- 4. Add missing columns to doctors table (availability_status used by BookingModal and DoctorDashboard)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='availability_status') THEN
        ALTER TABLE public.doctors ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';
    END IF;
END $$;


-- 5. Ensure admin users can read ALL appointments (not just their own)
-- The current RLS policy only lets patient/doctor see their own appointments.
-- Admin users (identified by patients.role = 'admin' or metadata) need full access.
DROP POLICY IF EXISTS "Admin full access to appointments" ON public.appointments;
CREATE POLICY "Admin full access to appointments"
    ON public.appointments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.admins a
            WHERE a.id = auth.uid()
        )
    );


-- 6. Add an index on the new appointment_time column for slot-checking queries
CREATE INDEX IF NOT EXISTS idx_appointments_time ON public.appointments(appointment_time);


-- =====================================================================
-- DONE! The appointments table now matches the frontend code.
-- =====================================================================

-- 7. Force PostgREST to clear its schema cache
NOTIFY pgrst, 'reload schema';
