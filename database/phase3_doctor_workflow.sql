-- =============================================================
-- database/phase3_doctor_workflow.sql
-- Khushi Hygieia — Upgrades for AI Triage Queue
-- =============================================================

-- Add urgency to appointments (Emergency, Urgent, Routine)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'Routine';

-- Add symptoms to appointments so doctors can see why they were triaged
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS symptoms TEXT;
