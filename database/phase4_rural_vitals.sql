-- =============================================================
-- database/phase4_rural_vitals.sql
-- Khushi Hygieia — Rural Healthcare Vitals Table
-- =============================================================

CREATE TABLE IF NOT EXISTS vitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_name VARCHAR(100) NOT NULL,
    patient_phone VARCHAR(20),
    village_name VARCHAR(100),
    blood_pressure VARCHAR(20),
    heart_rate INTEGER,
    spo2 INTEGER,
    temperature DECIMAL(4,1),
    blood_glucose INTEGER,
    notes TEXT,
    entered_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: In a real environment, set up RLS policies here
-- For Hackathon purposes, we leave it open or handle via service key
