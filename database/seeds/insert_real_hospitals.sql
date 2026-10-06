-- ============================================================
-- REAL HOSPITALS DATA INSERT
-- Run this in Supabase SQL Editor
-- This script:
--   1. Adds missing columns (teleconsult, beds, email, departments) to hospitals table
--   2. Deletes ALL old/fake hospital data
--   3. Inserts real hospitals from the CSV files
-- ============================================================

-- Step 1: Add missing columns if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='teleconsult') THEN
        ALTER TABLE public.hospitals ADD COLUMN teleconsult BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='beds') THEN
        ALTER TABLE public.hospitals ADD COLUMN beds INTEGER DEFAULT 200;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='email') THEN
        ALTER TABLE public.hospitals ADD COLUMN email VARCHAR(200);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='departments') THEN
        ALTER TABLE public.hospitals ADD COLUMN departments TEXT;
    END IF;
END $$;

-- Step 2: Remove ALL old hospital data
DELETE FROM public.hospitals;

-- Step 3: Insert real hospitals from Offline Appointments CSV
-- ===========================================================

-- 1. Apollo Hospitals, Jubilee Hills
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Apollo Hospitals, Jubilee Hills',
    'Hyderabad',
    'Film Nagar Main Road, Near Chiranjeevi Guest House, Jubilee Hills, Hyderabad - 500033',
    '+91 40 2360 7777',
    TRUE,
    TRUE,
    500,
    'apollohealthcityhyd@apollohospitals.com',
    'General Medicine, Cardiology, Neurology, Neurosurgery, Orthopedics, Gastroenterology, Nephrology, Urology, Pulmonology, Oncology, Endocrinology, Rheumatology, Obstetrics & Gynaecology, Paediatrics, ENT, Dermatology, Psychiatry, Transplants',
    4.8
);

-- 2. Apollo Hospitals, Secunderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Apollo Hospitals, Secunderabad',
    'Secunderabad',
    'Secunderabad (DRDO branch reference), Hyderabad',
    '040-23607777',
    TRUE,
    TRUE,
    400,
    'apollohealthcityhyd@apollohospitals.com',
    'General Medicine, Cardiology, Neurology, Neurosurgery, Orthopedics, Gastroenterology, Nephrology, Urology, Pulmonology, Oncology, Endocrinology, Rheumatology, Obstetrics & Gynaecology, Paediatrics, ENT, Dermatology, Psychiatry, Transplants',
    4.7
);

-- 3. PACE Hospitals, HITEC City
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'PACE Hospitals, HITEC City',
    'Hyderabad',
    'Metro Pillar C1772, Beside Avasa Hotel, Hitech City Road, Hyderabad – 500081',
    '08885095614',
    TRUE,
    TRUE,
    250,
    'ips@pacehospitals.in',
    'Medical & Surgical Gastroenterology, Hepatology, Nephrology, Urology, Orthopaedics & Spine, Neurology & Neurosurgery, Cardiology & CTVS, Pulmonology, Internal Medicine & Diabetology, Endocrinology, Rheumatology, Gynaecology, Paediatrics, ENT, Dermatology, Psychiatry, Physiotherapy, Dentistry',
    4.7
);

-- 4. PACE Hospitals, Madinaguda
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'PACE Hospitals, Madinaguda',
    'Hyderabad',
    'Mythri Nagar, Beside South India Shopping Mall, Madinaguda, Hyderabad - 500050',
    '040-48486868',
    TRUE,
    FALSE,
    200,
    'info@pacehospitals.in',
    'Medical & Surgical Gastroenterology, Hepatology, Nephrology, Urology, Orthopaedics & Spine, Neurology & Neurosurgery, Cardiology & CTVS, Pulmonology, Internal Medicine & Diabetology, Endocrinology, Rheumatology, Gynaecology, Paediatrics, ENT, Dermatology, Psychiatry, Physiotherapy, Dentistry',
    4.5
);

-- 5. CARE Hospitals, Banjara Hills
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'CARE Hospitals, Banjara Hills',
    'Hyderabad',
    'CARE Hospitals, Road No.1, Banjara Hills, Hyderabad – 500034',
    '+91 40 6810 6565',
    TRUE,
    TRUE,
    350,
    'info@carehospitals.com',
    'Cardiology & CTVS, Neurology & Neurosurgery, Nephrology, Urology, Gastroenterology & Hepatology, Orthopedics, General & Critical Care Medicine, Paediatrics & Neonatology, Obstetrics & Gynaecology, Oncology, Pulmonology, Endocrinology, Rheumatology, Dermatology, ENT, Vascular Surgery, Physiotherapy',
    4.6
);

-- 6. Yashoda Hospitals, Secunderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Yashoda Hospitals, Secunderabad',
    'Secunderabad',
    'Alexander Road, Secunderabad – 500003',
    '+91 9513262681',
    TRUE,
    TRUE,
    400,
    'query@yashodamail.com',
    'Cardiology, CT Surgery, Oncology, Neurology, Neurosurgery, Orthopedics, Spine Surgery, Gastroenterology, General Medicine, General Surgery, Nephrology, Urology, Kidney Transplant, Vascular Surgery, Haematology & BMT, Pulmonology, ENT, Gynaecology, Endocrinology, Rheumatology, Ophthalmology, Dermatology, Plastic Surgery, Paediatrics, Pain Medicine, Interventional Radiology, Organ Transplants, Robotic Surgery',
    4.8
);

-- 7. Yashoda Hospitals, Somajiguda
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Yashoda Hospitals, Somajiguda',
    'Hyderabad',
    'Rajbhavan Road, Somajiguda, Hyderabad – 500082',
    '+91 9513262681',
    TRUE,
    TRUE,
    350,
    'query@yashodamail.com',
    'Cardiology, CT Surgery, Oncology, Neurology, Neurosurgery, Orthopedics, Spine Surgery, Gastroenterology, General Medicine, General Surgery, Nephrology, Urology, Kidney Transplant, Vascular Surgery, Haematology & BMT, Pulmonology, ENT, Gynaecology, Endocrinology, Rheumatology, Ophthalmology, Dermatology, Plastic Surgery, Paediatrics, Pain Medicine, Organ Transplants, Robotic Surgery',
    4.7
);

-- 8. Yashoda Hospitals, Malakpet
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Yashoda Hospitals, Malakpet',
    'Hyderabad',
    'Nalgonda X Roads, Malakpet, Hyderabad – 500036',
    '+91 9513262681',
    TRUE,
    TRUE,
    300,
    'query@yashodamail.com',
    'Cardiology, CT Surgery, Oncology, Neurology, Neurosurgery, Orthopedics, Spine Surgery, Gastroenterology, General Medicine, General Surgery, Nephrology, Urology, Kidney Transplant, Vascular Surgery, Haematology & BMT, Pulmonology, ENT, Gynaecology, Endocrinology, Rheumatology, Ophthalmology, Dermatology, Plastic Surgery, Paediatrics, Pain Medicine, Organ Transplants, Robotic Surgery',
    4.6
);

-- 9. Yashoda Hospitals, Hitech City
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Yashoda Hospitals, Hitech City',
    'Hyderabad',
    'Kothaguda, Hitec City, Telangana, 500084',
    '+91 9513262681',
    TRUE,
    TRUE,
    350,
    'query@yashodamail.com',
    'Cardiology, CT Surgery, Oncology, Neurology, Neurosurgery, Orthopedics, Spine Surgery, Gastroenterology, General Medicine, General Surgery, Nephrology, Urology, Kidney Transplant, Haematology & BMT, Pulmonology, ENT, Gynaecology, Endocrinology, Rheumatology, Ophthalmology, Dermatology, Plastic Surgery, Paediatrics, Pain Medicine, Organ Transplants, Robotic Surgery',
    4.7
);

-- 10. Citizens Specialty Hospital, Nallagandla
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Citizens Specialty Hospital, Nallagandla',
    'Hyderabad',
    '1-100/1/CCH, Citizens Hospital Rd, Nallagandla, Serilingampally, Hyderabad - 500019',
    '040 6719 1919',
    TRUE,
    TRUE,
    300,
    'info@citizenshospitals.com',
    'Cardiology, CTVS, Internal Medicine, Neurology, Neurosurgery, Orthopedics, Rheumatology, Pulmonology, Nephrology, Urology, Gastroenterology, General & Bariatric Surgery, Oncology & BMT, Paediatrics & Neonatology, Obstetrics & Gynaecology, Dermatology, ENT, Ophthalmology, Psychiatry, Nutrition & Dietetics, Physiotherapy',
    4.7
);

-- 11. Continental Hospitals, Gachibowli
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Continental Hospitals, Gachibowli',
    'Hyderabad',
    'Plot No 3, Road No.2, Financial District, Gachibowli, Nanakramguda, Hyderabad – 500032, Telangana',
    '+91 40 6700 0000',
    TRUE,
    TRUE,
    750,
    'info@continentalhospitals.com',
    'General Medicine, Cardiology, Neurology, Gastroenterology, Oncology, Orthopedics, Paediatrics, Dermatology, Gynecology, ENT, Pulmonology, Nephrology, Urology, Dental',
    4.6
);

-- 12. Sravani Hospitals, Hyderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Sravani Hospitals, Hyderabad',
    'Hyderabad',
    'Plot no 91, Cyber hills, Guttala Begumpet, Madhapur, Hyderabad - 500033',
    '+91 91335 01555',
    TRUE,
    FALSE,
    100,
    'info@sravanihospitals.com',
    'General Medicine, Cardiology, Orthopedics, Gynaecology, Paediatrics',
    4.3
);

-- 13. KIMS Hospitals, Secunderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'KIMS Hospitals, Secunderabad',
    'Secunderabad',
    '1-8-31/1, Minister Road, Secunderabad, Hyderabad - 500003',
    '040 4488 5000',
    TRUE,
    TRUE,
    1000,
    'assistance@kimshospitals.com',
    'Cardiac Sciences, Neuro Sciences, Gastroenterology & Hepatology, Oncology, Orthopaedics, Organ Transplantation, Renal Sciences, Paediatrics, Obstetrics & Gynaecology, Pulmonology, Endocrinology, Urology, Dental Sciences, Bariatric Surgery, Heart & Lung Transplantation, Robotic Surgery, Critical Care, Emergency Medicine, Diagnostics, Pain Clinic, Dietetics, Clinical Psychology',
    4.9
);

-- 14. AIG Hospitals, Gachibowli
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'AIG Hospitals, Gachibowli',
    'Hyderabad',
    '1-66, Mindspace Rd, Gachibowli, Hyderabad - 500032',
    '040 4244 4222',
    TRUE,
    FALSE,
    800,
    'info@aighospitals.com',
    'Gastroenterology, Liver, HPB & Pancreas, Cardiology, Pulmonology, Nephrology, Oncology, Critical Care',
    4.7
);

-- 15. Rainbow Children''s Hospital
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Rainbow Children''s Hospital',
    'Hyderabad',
    'Multiple branches (Banjara Hills, Kondapur, LB Nagar)',
    '040 4969 6969',
    TRUE,
    FALSE,
    150,
    'info@rainbowhospitals.in',
    'Paediatrics, Neonatology, Pediatric Surgery, Obstetrics & Gynaecology (BirthRight), Pediatric subspecialties',
    4.8
);

-- 16. Sunshine Hospitals, Hyderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Sunshine Hospitals',
    'Hyderabad',
    'Begumpet, Hyderabad',
    '040 4455 0000',
    TRUE,
    FALSE,
    300,
    'info@sunshinehospitals.com',
    'Orthopedics & Joint Replacement, Spine, Trauma, Cardiology, Neurology, General Medicine, Critical Care',
    4.5
);

-- 17. Aster Prime Hospitals, Hyderabad
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Aster Prime Hospitals',
    'Hyderabad',
    'Plot No 4, Mythrivanam, Ameerpet, Hyderabad - 500038',
    '040 4488 9999',
    TRUE,
    FALSE,
    250,
    'info@asterhospitals.com',
    'Internal Medicine, Cardiology, Neurology, Orthopedics, Gastroenterology, Nephrology, Urology, Pulmonology, Oncology, Paediatrics, Obstetrics & Gynaecology',
    4.5
);

-- 18. Apollo TeleHealth Services (Video Appointments Only)
INSERT INTO public.hospitals (name, city, address, phone, emergency, teleconsult, beds, email, departments, rating)
VALUES (
    'Apollo TeleHealth Services',
    'Hyderabad',
    'Krishe Sapphire Building, 9th Floor, MSR Block, Survey No. 88, HI-Tech City Main Road, Madhapur, Hyderabad - 500081',
    '+91 40 2360 7777',
    FALSE,
    TRUE,
    0,
    'connect@apollotelehealth.com',
    'General Physician, Cardiology, Neurology, Orthopedics, Gastroenterology, Nephrology, Urology, Pulmonology, Endocrinology, Rheumatology, Obstetrics & Gynaecology, Paediatrics, Dermatology, ENT, Psychiatry, Oncology, General Surgery, Infectious Diseases, Geriatrics, Allergy & Immunology, Pain Management, Nutrition & Dietetics',
    4.6
);

-- ============================================================
-- DONE! All 18 real hospitals have been inserted.
-- ============================================================
