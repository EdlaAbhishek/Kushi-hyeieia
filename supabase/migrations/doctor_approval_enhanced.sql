-- =====================================================
-- Khushi Hygieia: Doctor Application & Approval Schema
-- Run this in the Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to doctor_applications table
ALTER TABLE doctor_applications
    ADD COLUMN IF NOT EXISTS clinic_name TEXT,
    ADD COLUMN IF NOT EXISTS clinic_address TEXT,
    ADD COLUMN IF NOT EXISTS consultation_fee INTEGER,
    ADD COLUMN IF NOT EXISTS available_days TEXT,
    ADD COLUMN IF NOT EXISTS available_timings TEXT,
    ADD COLUMN IF NOT EXISTS qualification TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS practice_type TEXT DEFAULT 'hospital',
    ADD COLUMN IF NOT EXISTS ai_verification_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS ai_verification_notes TEXT;

-- 2. Add hospital_id column to doctors table (for direct foreign key link)
ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id),
    ADD COLUMN IF NOT EXISTS clinic_name TEXT,
    ADD COLUMN IF NOT EXISTS clinic_address TEXT,
    ADD COLUMN IF NOT EXISTS available_days TEXT,
    ADD COLUMN IF NOT EXISTS available_timings TEXT,
    ADD COLUMN IF NOT EXISTS consultation_fee INTEGER,
    ADD COLUMN IF NOT EXISTS qualification TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. Create/replace the approval RPC function
--    This function:
--    a) Updates user role to 'doctor'
--    b) Creates an entry in the 'doctors' table with hospital_id linked
--    c) Deletes the application after approval
CREATE OR REPLACE FUNCTION approve_doctor_application(app_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    app RECORD;
    hospital_record RECORD;
    matched_hospital_id UUID;
BEGIN
    -- Fetch the application
    SELECT * INTO app FROM doctor_applications WHERE id = app_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found';
    END IF;

    -- Try to find matching hospital by name
    IF app.hospital_affiliation IS NOT NULL AND app.hospital_affiliation != '' THEN
        SELECT id INTO matched_hospital_id
        FROM hospitals
        WHERE LOWER(name) = LOWER(TRIM(app.hospital_affiliation))
        LIMIT 1;
        
        -- If no exact match, try partial match
        IF matched_hospital_id IS NULL THEN
            SELECT id INTO matched_hospital_id
            FROM hospitals
            WHERE LOWER(name) LIKE '%' || LOWER(TRIM(app.hospital_affiliation)) || '%'
               OR LOWER(TRIM(app.hospital_affiliation)) LIKE '%' || LOWER(name) || '%'
            LIMIT 1;
        END IF;
    END IF;

    -- 1) Update user role to doctor
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || 
        jsonb_build_object(
            'role', 'doctor',
            'full_name', app.full_name
        )
    WHERE id = app.user_id;

    -- 2) Insert into doctors table with hospital link
    INSERT INTO doctors (
        user_id,
        name,
        specialty,
        experience,
        hospital,
        hospital_id,
        hospital_name,
        license_number,
        clinic_name,
        clinic_address,
        consultation_fee,
        available_days,
        available_timings,
        qualification,
        bio,
        verified,
        created_at
    ) VALUES (
        app.user_id,
        app.full_name,
        app.specialization,
        app.experience_years,
        app.hospital_affiliation,
        matched_hospital_id,
        app.hospital_affiliation,
        app.license_number,
        app.clinic_name,
        app.clinic_address,
        app.consultation_fee,
        app.available_days,
        app.available_timings,
        app.qualification,
        app.bio,
        TRUE,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        specialty = EXCLUDED.specialty,
        experience = EXCLUDED.experience,
        hospital = EXCLUDED.hospital,
        hospital_id = EXCLUDED.hospital_id,
        hospital_name = EXCLUDED.hospital_name,
        license_number = EXCLUDED.license_number,
        clinic_name = EXCLUDED.clinic_name,
        clinic_address = EXCLUDED.clinic_address,
        consultation_fee = EXCLUDED.consultation_fee,
        available_days = EXCLUDED.available_days,
        available_timings = EXCLUDED.available_timings,
        qualification = EXCLUDED.qualification,
        bio = EXCLUDED.bio,
        verified = TRUE;

    -- 3) Delete the processed application
    DELETE FROM doctor_applications WHERE id = app_id;
END;
$$;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION approve_doctor_application(UUID) TO authenticated;
