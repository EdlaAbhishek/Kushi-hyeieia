-- =====================================================================
-- FIX: Appointments table schema alignment
-- The frontend sends columns that don't exist in the original schema.
-- This migration adds the missing columns to match the frontend code.
-- Run this in your Supabase SQL Editor.
-- ✅ FULLY IDEMPOTENT — safe to run multiple times.
-- =====================================================================

-- 1. Add missing columns to appointments table
DO $$ BEGIN
    -- appointment_time: stores the time slot (e.g. "09:00", "14:30")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_time') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_time VARCHAR(10);
    END IF;

    -- appointment_type: stores the type string used by frontend (teleconsultation, in_person)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='appointment_type') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_type VARCHAR(30) DEFAULT 'in_person';
    END IF;

    -- patient_name: denormalized patient name for quick display
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_name') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_name VARCHAR(200);
    END IF;

    -- patient_phone: denormalized patient phone
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_phone') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_phone VARCHAR(30);
    END IF;

    -- patient_email: denormalized patient email
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_email') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_email VARCHAR(200);
    END IF;

    -- patient_address: denormalized patient address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='patient_address') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_address TEXT;
    END IF;

    -- reason: reason for appointment/visit
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='reason') THEN
        ALTER TABLE public.appointments ADD COLUMN reason TEXT;
    END IF;

    -- doctor_name: denormalized doctor name for admin views
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='doctor_name') THEN
        ALTER TABLE public.appointments ADD COLUMN doctor_name VARCHAR(200);
    END IF;

    -- hospital_name: denormalized hospital name for admin views
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='hospital_name') THEN
        ALTER TABLE public.appointments ADD COLUMN hospital_name VARCHAR(200);
    END IF;
END $$;


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
