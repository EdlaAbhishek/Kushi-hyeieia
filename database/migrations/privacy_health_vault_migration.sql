-- =====================================================================
-- MIGRATION: Privacy Mode, Health Vault & Access Requests
-- Adds sensitive column, record_permissions, access_requests tables
-- =====================================================================

-- 1. Add sensitive boolean column to patient_records (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patient_records') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='patient_records' AND column_name='sensitive') THEN
            ALTER TABLE public.patient_records ADD COLUMN sensitive BOOLEAN DEFAULT false;
        END IF;
    ELSE
        -- Create patient_records table if it doesn't exist
        CREATE TABLE public.patient_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            file_url TEXT NOT NULL,
            file_name TEXT,
            record_type VARCHAR(50) DEFAULT 'other',
            sensitive BOOLEAN DEFAULT false,
            description TEXT,
            uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;

        CREATE INDEX IF NOT EXISTS idx_patient_records_patient ON public.patient_records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_patient_records_sensitive ON public.patient_records(sensitive);
    END IF;
END $$;

-- 2. RLS Policies for patient_records
DROP POLICY IF EXISTS "Patients can read own records" ON public.patient_records;
DROP POLICY IF EXISTS "Patients can insert own records" ON public.patient_records;
DROP POLICY IF EXISTS "Patients can delete own records" ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can read permitted records" ON public.patient_records;

CREATE POLICY "Patients can read own records"
    ON public.patient_records FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own records"
    ON public.patient_records FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own records"
    ON public.patient_records FOR DELETE
    USING (auth.uid() = patient_id);

-- Doctors can read records if they have a valid, non-revoked, non-expired permission
CREATE POLICY "Doctors can read permitted records"
    ON public.patient_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.record_permissions rp
            WHERE rp.patient_id = patient_records.patient_id
              AND rp.doctor_id = auth.uid()
              AND rp.access_granted = true
              AND rp.access_revoked = false
              AND rp.expires_at > NOW()
        )
    );


-- 3. Create record_permissions table
CREATE TABLE IF NOT EXISTS public.record_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    access_granted BOOLEAN DEFAULT true,
    access_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.record_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_record_permissions_patient ON public.record_permissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_record_permissions_doctor ON public.record_permissions(doctor_id);

DROP POLICY IF EXISTS "Users can read own permissions" ON public.record_permissions;
DROP POLICY IF EXISTS "Authenticated can insert permissions" ON public.record_permissions;
DROP POLICY IF EXISTS "Patients can update own permissions" ON public.record_permissions;

CREATE POLICY "Users can read own permissions"
    ON public.record_permissions FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Authenticated can insert permissions"
    ON public.record_permissions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Patients can update own permissions"
    ON public.record_permissions FOR UPDATE
    USING (auth.uid() = patient_id);


-- 4. Create access_requests table (doctor → patient unlock requests)
CREATE TABLE IF NOT EXISTS public.access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    requested_duration INTEGER DEFAULT 30, -- minutes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_access_requests_patient ON public.access_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_doctor ON public.access_requests(doctor_id);

DROP POLICY IF EXISTS "Doctors can create access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Users can read own access requests" ON public.access_requests;
DROP POLICY IF EXISTS "Patients can update own access requests" ON public.access_requests;

CREATE POLICY "Doctors can create access requests"
    ON public.access_requests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own access requests"
    ON public.access_requests FOR SELECT
    USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

CREATE POLICY "Patients can update own access requests"
    ON public.access_requests FOR UPDATE
    USING (auth.uid() = patient_id);


-- 5. Create medical-records storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read medical records" ON storage.objects;
DROP POLICY IF EXISTS "Auth insert medical records" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete medical records" ON storage.objects;

CREATE POLICY "Public read medical records"
    ON storage.objects FOR SELECT USING (bucket_id = 'medical-records');
CREATE POLICY "Auth insert medical records"
    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-records' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete medical records"
    ON storage.objects FOR DELETE USING (bucket_id = 'medical-records' AND auth.role() = 'authenticated');

-- =====================================================================
-- DONE! Run this in Supabase SQL Editor.
-- =====================================================================
