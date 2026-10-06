-- =====================================================
-- FIX: Add missing columns to doctors table
-- The admin panel and RPC function reference columns
-- (name, experience, hospital) that may not exist.
-- Run this in the Supabase SQL Editor.
-- =====================================================

-- Add missing columns that the approve_doctor_application RPC
-- and admin panel pages expect
ALTER TABLE public.doctors
    ADD COLUMN IF NOT EXISTS name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS experience INTEGER,
    ADD COLUMN IF NOT EXISTS hospital VARCHAR(200),
    ADD COLUMN IF NOT EXISTS license_number TEXT;

-- Backfill: copy full_name → name for any existing rows where name is null
UPDATE public.doctors
SET name = full_name
WHERE name IS NULL AND full_name IS NOT NULL;

-- Also add missing columns for appointments denormalized data
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS patient_name TEXT,
    ADD COLUMN IF NOT EXISTS doctor_name TEXT,
    ADD COLUMN IF NOT EXISTS hospital_name TEXT,
    ADD COLUMN IF NOT EXISTS date TEXT,
    ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'in_person',
    ADD COLUMN IF NOT EXISTS time TEXT;

-- Add RLS policies for admin operations on doctors
DROP POLICY IF EXISTS "Admins can delete doctors" ON public.doctors;
CREATE POLICY "Admins can delete doctors"
    ON public.doctors FOR DELETE USING (true);

-- Add RLS policies for admin operations on appointments  
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
CREATE POLICY "Admins can view all appointments"
    ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update all appointments" ON public.appointments;
CREATE POLICY "Admins can update all appointments"
    ON public.appointments FOR UPDATE USING (true);

-- Add RLS policies for admin operations on hospitals
DROP POLICY IF EXISTS "Admins can insert hospitals" ON public.hospitals;
CREATE POLICY "Admins can insert hospitals"
    ON public.hospitals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update hospitals" ON public.hospitals;
CREATE POLICY "Admins can update hospitals"
    ON public.hospitals FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete hospitals" ON public.hospitals;
CREATE POLICY "Admins can delete hospitals"
    ON public.hospitals FOR DELETE USING (true);

-- Add RLS policies for admin operations on doctor_applications
DROP POLICY IF EXISTS "Admins can view all applications" ON public.doctor_applications;
CREATE POLICY "Admins can view all applications"
    ON public.doctor_applications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can delete applications" ON public.doctor_applications;
CREATE POLICY "Admins can delete applications"
    ON public.doctor_applications FOR DELETE USING (true);

DROP POLICY IF EXISTS "Admins can update applications" ON public.doctor_applications;
CREATE POLICY "Admins can update applications"
    ON public.doctor_applications FOR UPDATE USING (true);

-- =====================================================
-- DONE! Missing columns added and RLS policies updated.
-- =====================================================
