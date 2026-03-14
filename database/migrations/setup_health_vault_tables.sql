-- =====================================================================
-- HEALTH VAULT TABLES SETUP
-- Run this in your Supabase SQL Editor to create missing tables used by
-- the HealthVault.jsx component (medical records, sharing, etc.)
-- =====================================================================

-- 1. patient_records table
CREATE TABLE IF NOT EXISTS public.patient_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    record_type VARCHAR(50) DEFAULT 'other',
    sensitive BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can manage their own records" ON public.patient_records;
CREATE POLICY "Patients can manage their own records"
    ON public.patient_records FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

-- 2. record_permissions table (sharing records with doctors)
CREATE TABLE IF NOT EXISTS public.record_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    access_granted BOOLEAN DEFAULT true,
    access_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.record_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients manage their own permissions" ON public.record_permissions;
CREATE POLICY "Patients manage their own permissions"
    ON public.record_permissions FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view their own permissions" ON public.record_permissions;
CREATE POLICY "Doctors can view their own permissions"
    ON public.record_permissions FOR SELECT
    USING (auth.uid() = doctor_id);

-- 3. access_requests table (doctors requesting access)
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients manage access requests to them" ON public.access_requests;
CREATE POLICY "Patients manage access requests to them"
    ON public.access_requests FOR ALL
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can manage their outgoing requests" ON public.access_requests;
CREATE POLICY "Doctors can manage their outgoing requests"
    ON public.access_requests FOR ALL
    USING (auth.uid() = doctor_id)
    WITH CHECK (auth.uid() = doctor_id);

-- Storage bucket for medical records (if not already created)
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient_records
DROP POLICY IF EXISTS "Patients can upload their own records" ON storage.objects;
CREATE POLICY "Patients can upload their own records"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'medical-records' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

DROP POLICY IF EXISTS "Patients can update their own records" ON storage.objects;
CREATE POLICY "Patients can update their own records"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'medical-records' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

DROP POLICY IF EXISTS "Patients can read their own records" ON storage.objects;
CREATE POLICY "Patients can read their own records"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'medical-records' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

DROP POLICY IF EXISTS "Patients can delete their own records" ON storage.objects;
CREATE POLICY "Patients can delete their own records"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'medical-records' AND auth.uid()::text = (string_to_array(name, '/'))[1]);

-- Add policy for doctors to read records if they have an active permission
DROP POLICY IF EXISTS "Doctors can read records with active permission" ON storage.objects;
CREATE POLICY "Doctors can read records with active permission"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-records' 
        AND EXISTS (
            SELECT 1 FROM public.record_permissions rp
            WHERE rp.doctor_id = auth.uid()
            AND rp.patient_id::text = (string_to_array(name, '/'))[1]
            AND rp.access_granted = true
            AND rp.access_revoked = false
            AND rp.expires_at > NOW()
        )
    );
