-- =====================================================================
-- MIGRATION: Women's Privacy Mode + Health Vault
-- Khushi Hygieia Healthcare Platform
-- ✅ FULLY IDEMPOTENT — safe to run multiple times
-- =====================================================================


-- ══════════════════════════════════════════════════════════════
-- SECTION 1: ALTER EXISTING TABLES — Women's Privacy Mode
-- ══════════════════════════════════════════════════════════════

-- 1a. Add gender and women_friendly columns to doctors
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='gender') THEN
        ALTER TABLE public.doctors ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='women_friendly') THEN
        ALTER TABLE public.doctors ADD COLUMN women_friendly BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1b. Add women_friendly column to hospitals
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='women_friendly') THEN
        ALTER TABLE public.hospitals ADD COLUMN women_friendly BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 1c. Add anonymous_consultation column to appointments
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='appointments' AND column_name='anonymous_consultation') THEN
        ALTER TABLE public.appointments ADD COLUMN anonymous_consultation BOOLEAN DEFAULT false;
    END IF;
END $$;


-- ══════════════════════════════════════════════════════════════
-- SECTION 2: NEW TABLES — Health Vault
-- ══════════════════════════════════════════════════════════════

-- 2a. Patient Records (Health Vault)
CREATE TABLE IF NOT EXISTS public.patient_records (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url      TEXT        NOT NULL,
    file_name     TEXT,
    record_type   TEXT        NOT NULL CHECK (record_type IN ('prescription', 'lab_report', 'scan', 'xray', 'discharge_summary', 'other')),
    description   TEXT,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. Record Permissions (Timed sharing with doctors)
CREATE TABLE IF NOT EXISTS public.record_permissions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    doctor_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ NOT NULL,
    access_granted  BOOLEAN     NOT NULL DEFAULT TRUE,
    access_revoked  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add columns if the table already existed before this update
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='record_permissions' AND column_name='access_granted') THEN
        ALTER TABLE public.record_permissions ADD COLUMN access_granted BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='record_permissions' AND column_name='access_revoked') THEN
        ALTER TABLE public.record_permissions ADD COLUMN access_revoked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3: INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_patient_records_patient ON public.patient_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_records_type    ON public.patient_records(record_type);
CREATE INDEX IF NOT EXISTS idx_record_perms_patient    ON public.record_permissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_record_perms_doctor     ON public.record_permissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_record_perms_expires    ON public.record_permissions(expires_at);
CREATE INDEX IF NOT EXISTS idx_doctors_gender          ON public.doctors(gender);
CREATE INDEX IF NOT EXISTS idx_doctors_women_friendly  ON public.doctors(women_friendly) WHERE women_friendly = TRUE;
CREATE INDEX IF NOT EXISTS idx_hospitals_women_friendly ON public.hospitals(women_friendly) WHERE women_friendly = TRUE;


-- ══════════════════════════════════════════════════════════════
-- SECTION 4: ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.patient_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_permissions  ENABLE ROW LEVEL SECURITY;

-- ── PATIENT RECORDS ──
DROP POLICY IF EXISTS "Patients can view own records"       ON public.patient_records;
DROP POLICY IF EXISTS "Patients can insert own records"     ON public.patient_records;
DROP POLICY IF EXISTS "Patients can delete own records"     ON public.patient_records;
DROP POLICY IF EXISTS "Doctors can view permitted records"  ON public.patient_records;

-- Patients: full CRUD on own records
CREATE POLICY "Patients can view own records"
    ON public.patient_records FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own records"
    ON public.patient_records FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own records"
    ON public.patient_records FOR DELETE
    USING (auth.uid() = patient_id);

-- Doctors: can view records ONLY if they have a valid (non-expired) permission
CREATE POLICY "Doctors can view permitted records"
    ON public.patient_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.record_permissions rp
            WHERE rp.patient_id = patient_records.patient_id
              AND rp.doctor_id  = auth.uid()
              AND rp.expires_at > NOW()
              AND rp.access_granted = TRUE
              AND rp.access_revoked = FALSE
        )
    );


-- ── RECORD PERMISSIONS ──
DROP POLICY IF EXISTS "Patients can manage own permissions"    ON public.record_permissions;
DROP POLICY IF EXISTS "Patients can create permissions"        ON public.record_permissions;
DROP POLICY IF EXISTS "Patients can delete own permissions"    ON public.record_permissions;
DROP POLICY IF EXISTS "Doctors can view own permissions"       ON public.record_permissions;

CREATE POLICY "Patients can manage own permissions"
    ON public.record_permissions FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create permissions"
    ON public.record_permissions FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can delete own permissions"
    ON public.record_permissions FOR DELETE
    USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can view own permissions"
    ON public.record_permissions FOR SELECT
    USING (auth.uid() = doctor_id);

-- Patients can update their own permissions (for revoking access)
DROP POLICY IF EXISTS "Patients can update own permissions" ON public.record_permissions;
CREATE POLICY "Patients can update own permissions"
    ON public.record_permissions FOR UPDATE
    USING (auth.uid() = patient_id)
    WITH CHECK (auth.uid() = patient_id);


-- ══════════════════════════════════════════════════════════════
-- SECTION 5: STORAGE BUCKET — Medical Records
-- ══════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Patients upload own medical records"   ON storage.objects;
DROP POLICY IF EXISTS "Patients read own medical records"     ON storage.objects;
DROP POLICY IF EXISTS "Patients delete own medical records"   ON storage.objects;
DROP POLICY IF EXISTS "Doctors read permitted medical records" ON storage.objects;

-- Patients can upload files to their own folder: medical-records/{user_id}/*
CREATE POLICY "Patients upload own medical records"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Patients can read their own medical records
CREATE POLICY "Patients read own medical records"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Patients can delete their own medical records
CREATE POLICY "Patients delete own medical records"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Doctors can read medical records of patients who granted permission
CREATE POLICY "Doctors read permitted medical records"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-records'
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.record_permissions rp
            WHERE rp.doctor_id  = auth.uid()
              AND rp.patient_id::text = (storage.foldername(name))[1]
              AND rp.expires_at > NOW()
              AND rp.access_granted = TRUE
              AND rp.access_revoked = FALSE
        )
    );


-- ══════════════════════════════════════════════════════════════
-- SECTION 6: SAMPLE DATA — Mark some hospitals as women-friendly
-- ══════════════════════════════════════════════════════════════

UPDATE public.hospitals SET women_friendly = true
WHERE name IN (
    'Apollo Hospitals Jubilee Hills',
    'Care Hospitals',
    'KIMS Hospital',
    'Yashoda Hospitals',
    'Sunshine Hospitals'
);


-- ══════════════════════════════════════════════════════════════
-- DONE! New columns, tables, policies, and storage created.
-- ══════════════════════════════════════════════════════════════
