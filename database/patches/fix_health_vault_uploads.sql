-- =====================================================================
-- FIX: HEALTH VAULT DOCUMENT UPLOADS & PERMISSIONS
-- =====================================================================

-- 1. Create missing tables for Health Vault

-- Table: patient_records
CREATE TABLE IF NOT EXISTS public.patient_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    record_type text DEFAULT 'other',
    sensitive boolean DEFAULT false,
    uploaded_at timestamp with time zone DEFAULT now()
);

-- Table: record_permissions
CREATE TABLE IF NOT EXISTS public.record_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    access_granted boolean DEFAULT true,
    access_revoked boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: access_requests
CREATE TABLE IF NOT EXISTS public.access_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 2. Setup RLS for Health Vault Tables

-- Patient Records RLS
DROP POLICY IF EXISTS "Patients can upload records" ON public.patient_records;
CREATE POLICY "Patients can upload records" ON public.patient_records
    FOR INSERT WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can view own records" ON public.patient_records;
CREATE POLICY "Patients can view own records" ON public.patient_records
    FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Patients can delete own records" ON public.patient_records;
CREATE POLICY "Patients can delete own records" ON public.patient_records
    FOR DELETE USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view permitted records" ON public.patient_records;
CREATE POLICY "Doctors can view permitted records" ON public.patient_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.record_permissions rp
            WHERE rp.patient_id = patient_records.patient_id
              AND rp.doctor_id = auth.uid()
              AND rp.access_granted = true
              AND rp.access_revoked = false
              AND rp.expires_at > now()
        )
    );

-- Record Permissions RLS
DROP POLICY IF EXISTS "Patients can manage permissions" ON public.record_permissions;
CREATE POLICY "Patients can manage permissions" ON public.record_permissions
    FOR ALL USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can view their permissions" ON public.record_permissions;
CREATE POLICY "Doctors can view their permissions" ON public.record_permissions
    FOR SELECT USING (auth.uid() = doctor_id);

-- Access Requests RLS
DROP POLICY IF EXISTS "Patients can view and update requests" ON public.access_requests;
CREATE POLICY "Patients can view and update requests" ON public.access_requests
    FOR ALL USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Doctors can create and view requests" ON public.access_requests;
CREATE POLICY "Doctors can create and view requests" ON public.access_requests
    FOR ALL USING (auth.uid() = doctor_id);


-- 3. Setup Storage for medical-records bucket

-- Create the storage bucket for medical records if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload their own files
DROP POLICY IF EXISTS "Users can upload their own medical records" ON storage.objects;
CREATE POLICY "Users can upload their own medical records" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'medical-records'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage RLS: Users can view their own files
DROP POLICY IF EXISTS "Users can view their own medical records" ON storage.objects;
CREATE POLICY "Users can view their own medical records" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'medical-records'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage RLS: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete their own medical records" ON storage.objects;
CREATE POLICY "Users can delete their own medical records" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'medical-records'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage RLS: Doctors with permission can view files
DROP POLICY IF EXISTS "Doctors can view permitted medical records" ON storage.objects;
CREATE POLICY "Doctors can view permitted medical records" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'medical-records'
        AND EXISTS (
             SELECT 1 FROM public.record_permissions rp
             WHERE rp.patient_id::text = (storage.foldername(name))[1]
               AND rp.doctor_id = auth.uid()
               AND rp.access_granted = true
               AND rp.access_revoked = false
               AND rp.expires_at > now()
        )
    );
