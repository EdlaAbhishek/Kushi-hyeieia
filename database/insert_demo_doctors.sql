-- =====================================================
-- RECREATE DOCTORS TABLE + INSERT DEMO DATA
-- This drops the old table and creates a clean one
-- with ALL columns the app needs, then inserts 10 demo doctors.
-- Run this in Supabase SQL Editor in ONE shot.
-- =====================================================

-- Step 1: Drop the old doctors table (cascade removes dependent constraints)
DROP TABLE IF EXISTS public.doctors CASCADE;

-- Step 2: Create doctors table with ALL columns the app uses
CREATE TABLE public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    specialty TEXT,
    hospital_name TEXT,
    bio TEXT,
    license_number TEXT,
    verified BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    availability_status TEXT DEFAULT 'available',
    consultation_fee INTEGER,
    qualification TEXT,
    profile_photo TEXT,
    avatar_url TEXT,
    teleconsultation_available BOOLEAN DEFAULT false,
    gender TEXT,
    women_friendly BOOLEAN DEFAULT false,
    sub_specialty TEXT,
    experience TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies — allow everyone to read, authenticated to insert/update
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert doctors" ON public.doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update own doctor profile" ON public.doctors FOR UPDATE USING (true);
CREATE POLICY "Admins can delete doctors" ON public.doctors FOR DELETE USING (true);

-- Step 5: Insert 10 demo doctors
INSERT INTO public.doctors (full_name, email, specialty, hospital_name, experience, bio, license_number, verified, is_approved, available, availability_status, consultation_fee, qualification, teleconsultation_available, gender)
VALUES
('Dr. Aravind Reddy', 'aravind.reddy@khushihygieia.demo', 'Cardiology', 'Apollo Hospitals, Hyderabad', '15 years', 'Senior Cardiologist with expertise in interventional cardiology and heart failure management. Fellowship from AIIMS Delhi.', 'TSMC-28471', true, true, true, 'available', 800, 'MBBS, MD (Cardiology), DM (Cardiology)', true, 'male'),

('Dr. Priya Sharma', 'priya.sharma@khushihygieia.demo', 'Dermatology', 'KIMS Hospital, Secunderabad', '10 years', 'Renowned dermatologist specializing in cosmetic dermatology, acne treatment, and skin cancer screening.', 'TSMC-35892', true, true, true, 'available', 600, 'MBBS, MD (Dermatology)', true, 'female'),

('Dr. Rajesh Kumar', 'rajesh.kumar@khushihygieia.demo', 'Orthopedics', 'Care Hospitals, Banjara Hills', '20 years', 'Leading orthopedic surgeon with expertise in joint replacement, sports medicine, and spinal surgeries. Over 5000 successful surgeries.', 'TSMC-18234', true, true, true, 'available', 1000, 'MBBS, MS (Ortho), MCh (Ortho)', false, 'male'),

('Dr. Sneha Patel', 'sneha.patel@khushihygieia.demo', 'Pediatrics', 'Rainbow Children''s Hospital, Hyderabad', '12 years', 'Pediatric specialist with focus on neonatal care, childhood infections, and growth & development.', 'TSMC-42156', true, true, true, 'available', 500, 'MBBS, MD (Pediatrics), DNB', true, 'female'),

('Dr. Mohammed Irfan', 'irfan.mohammed@khushihygieia.demo', 'General Medicine', 'Yashoda Hospitals, Somajiguda', '8 years', 'General physician skilled in managing diabetes, hypertension, and infectious diseases. Trusted family doctor.', 'TSMC-51093', true, true, true, 'available', 400, 'MBBS, MD (General Medicine)', true, 'male'),

('Dr. Lakshmi Narasimhan', 'lakshmi.n@khushihygieia.demo', 'ENT', 'Continental Hospitals, Gachibowli', '14 years', 'ENT surgeon specializing in sinus surgery, hearing disorders, and head & neck oncology.', 'TSMC-29874', true, true, true, 'available', 700, 'MBBS, MS (ENT)', true, 'female'),

('Dr. Venkat Rao', 'venkat.rao@khushihygieia.demo', 'Neurology', 'Apollo Hospitals, Jubilee Hills', '18 years', 'Neurologist with expertise in stroke management, epilepsy, and neurodegenerative disorders. Published 50+ research papers.', 'TSMC-15672', true, true, true, 'busy', 1200, 'MBBS, MD (Neurology), DM (Neurology)', false, 'male'),

('Dr. Anitha Krishnan', 'anitha.k@khushihygieia.demo', 'Gynecology', 'Fernandez Hospital, Hyderabad', '16 years', 'Obstetrician & Gynecologist with specialization in high-risk pregnancies, laparoscopic surgery, and infertility treatment.', 'TSMC-22341', true, true, true, 'available', 900, 'MBBS, MS (OBG), DNB', true, 'female'),

('Dr. Srinivas Gupta', 'srinivas.g@khushihygieia.demo', 'Ophthalmology', 'L V Prasad Eye Institute', '22 years', 'Senior ophthalmologist specializing in cataract surgery, LASIK, and retinal disorders.', 'TSMC-10945', true, true, true, 'available', 750, 'MBBS, MS (Ophthalmology), FRCS', false, 'male'),

('Dr. Kavitha Devi', 'kavitha.d@khushihygieia.demo', 'Psychiatry', 'NIMHANS Outreach, Hyderabad', '11 years', 'Psychiatrist specializing in anxiety, depression, and adolescent mental health. Compassionate and culturally sensitive approach.', 'TSMC-38567', true, true, true, 'available', 600, 'MBBS, MD (Psychiatry)', true, 'female');

-- Step 6: Verify
SELECT full_name, specialty, hospital_name, availability_status FROM public.doctors ORDER BY full_name;
