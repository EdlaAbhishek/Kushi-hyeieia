-- =================================================================
-- FIX APPOINTMENTS TABLE SCHEMA
-- Adds all missing columns needed by the frontend booking system
-- Run this in Supabase SQL Editor
-- =================================================================

-- Ensure the appointments table exists
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add all necessary columns one by one
DO $$ 
BEGIN 
    -- Basic Relations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'doctor_id') THEN
        ALTER TABLE public.appointments ADD COLUMN doctor_id UUID REFERENCES public.doctors(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_id') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'hospital_id') THEN
        ALTER TABLE public.appointments ADD COLUMN hospital_id UUID;
    END IF;

    -- Time and Type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_date') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_time') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'appointment_type') THEN
        ALTER TABLE public.appointments ADD COLUMN appointment_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'type') THEN
        ALTER TABLE public.appointments ADD COLUMN type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'status') THEN
        ALTER TABLE public.appointments ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Patient Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_name') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_phone') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_email') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_email TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_address') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_address TEXT;
    END IF;

    -- Clinical Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'reason') THEN
        ALTER TABLE public.appointments ADD COLUMN reason TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'symptoms') THEN
        ALTER TABLE public.appointments ADD COLUMN symptoms TEXT;
    END IF;

    -- Denormalized Display Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'doctor_name') THEN
        ALTER TABLE public.appointments ADD COLUMN doctor_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'hospital_name') THEN
        ALTER TABLE public.appointments ADD COLUMN hospital_name TEXT;
    END IF;

    -- Urgent Context Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'priority') THEN
        ALTER TABLE public.appointments ADD COLUMN priority TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'triage_level') THEN
        ALTER TABLE public.appointments ADD COLUMN triage_level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_age') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'patient_gender') THEN
        ALTER TABLE public.appointments ADD COLUMN patient_gender TEXT;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Add policies so users can create appointments and view their own
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;
CREATE POLICY "Anyone can create appointments" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (auth.uid() = patient_id OR auth.uid() IN (SELECT user_id FROM doctors WHERE doctors.id = appointments.doctor_id));

-- Refresh the schema cache since we modified a table the API uses
NOTIFY pgrst, 'reload schema';
