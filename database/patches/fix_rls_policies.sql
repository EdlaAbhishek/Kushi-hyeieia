-- =====================================================================
-- FIX: "permission denied for table users" ERROR
-- The RLS policies were querying auth.users directly which is restricted.
-- This script drops the broken policies and recreates them using the
-- public.patients table for role lookups instead.
-- Run this in your Supabase SQL Editor.
-- =====================================================================

-- Drop all existing policies that reference auth.users role
DROP POLICY IF EXISTS "Patients read own" ON public.patients;
DROP POLICY IF EXISTS "Read own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctor read health reports" ON public.health_reports;
DROP POLICY IF EXISTS "Doctor read medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Read vitals history" ON public.vitals_history;
DROP POLICY IF EXISTS "Read workflow logs" ON public.workflow_logs;

-- Recreate policies using public.patients for role lookup
-- Patients: Users can read own row, doctors/admins read all
CREATE POLICY "Patients read own" ON public.patients
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
    );

-- Appointments: Read own (patient or doctor), admin reads all
CREATE POLICY "Read own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = patient_id
        OR auth.uid() = doctor_id
        OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
    );

-- Health Reports: Doctors can read
CREATE POLICY "Doctor read health reports" ON public.health_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
    );

-- Medical Records: Doctors can read
CREATE POLICY "Doctor read medical records" ON public.medical_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
    );

-- Vitals History: Doctors/health workers can read
CREATE POLICY "Read vitals history" ON public.vitals_history
    FOR SELECT USING (
        auth.uid() = patient_id
        OR auth.uid() = entered_by
        OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role IN ('admin', 'health_worker'))
    );

-- Workflow Logs: Admin only
CREATE POLICY "Read workflow logs" ON public.workflow_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.patients WHERE id = auth.uid() AND role = 'admin')
    );
