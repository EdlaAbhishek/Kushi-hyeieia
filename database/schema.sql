-- =============================================================
-- database/schema.sql
-- Khushi Hygieia — PostgreSQL Schema
-- =============================================================

-- Users (patients, doctors, admins)
CREATE TABLE users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   VARCHAR(120) NOT NULL,
    email       VARCHAR(200) NOT NULL UNIQUE,
    password_hash TEXT       NOT NULL,
    phone       VARCHAR(20),
    role        VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctors (extends users)
CREATE TABLE doctors (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialty       VARCHAR(100) NOT NULL,
    registration_no VARCHAR(50)  NOT NULL UNIQUE,
    hospital_id     UUID,
    bio             TEXT,
    verified        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hospitals
CREATE TABLE hospitals (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    address     TEXT        NOT NULL,
    lat         NUMERIC(10, 7),
    lng         NUMERIC(10, 7),
    phone       VARCHAR(20),
    emergency   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE doctors
    ADD CONSTRAINT fk_doctor_hospital
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL;

-- Appointments
CREATE TABLE appointments (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    doctor_id      UUID        NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
    hospital_id    UUID        REFERENCES hospitals(id)          ON DELETE SET NULL,
    scheduled_at   TIMESTAMPTZ NOT NULL,
    type           VARCHAR(20) NOT NULL DEFAULT 'in-person' CHECK (type IN ('in-person', 'telehealth')),
    status         VARCHAR(20) NOT NULL DEFAULT 'confirmed'  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergency Logs
CREATE TABLE emergency_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id) ON DELETE SET NULL,
    lat          NUMERIC(10, 7),
    lng          NUMERIC(10, 7),
    trigger_type VARCHAR(50),
    resolved     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI Chat Sessions
CREATE TABLE chat_sessions (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    messages   JSONB       NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_patient  ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor   ON appointments(doctor_id);
CREATE INDEX idx_appointments_schedule ON appointments(scheduled_at);
CREATE INDEX idx_doctors_specialty     ON doctors(specialty);
CREATE INDEX idx_hospitals_city        ON hospitals(city);
CREATE INDEX idx_hospitals_emergency   ON hospitals(emergency) WHERE emergency = TRUE;
