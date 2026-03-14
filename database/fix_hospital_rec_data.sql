-- =====================================================================
-- FIX: INFINITE RECURSION IN RLS & EMPTY HOSPITALS DATA
-- =====================================================================

-- 1. Create a secure function to fetch user role to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.patients WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create a secure function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update all policies that cause infinite recursion on patients table
DROP POLICY IF EXISTS "Patients read own" ON public.patients;
CREATE POLICY "Patients read own" ON public.patients
    FOR SELECT USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR is_admin_user()
    );

DROP POLICY IF EXISTS "Read own appointments" ON public.appointments;
CREATE POLICY "Read own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = patient_id
        OR auth.uid() = doctor_id
        OR is_admin_user()
    );

DROP POLICY IF EXISTS "Doctor read health reports" ON public.health_reports;
CREATE POLICY "Doctor read health reports" ON public.health_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR is_admin_user()
    );

DROP POLICY IF EXISTS "Doctor read medical records" ON public.medical_records;
CREATE POLICY "Doctor read medical records" ON public.medical_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR is_admin_user()
    );

DROP POLICY IF EXISTS "Read vitals history" ON public.vitals_history;
CREATE POLICY "Read vitals history" ON public.vitals_history
    FOR SELECT USING (
        auth.uid() = patient_id
        OR auth.uid() = entered_by
        OR EXISTS (SELECT 1 FROM public.doctors WHERE id = auth.uid())
        OR get_user_role() IN ('admin', 'health_worker')
    );

DROP POLICY IF EXISTS "Read workflow logs" ON public.workflow_logs;
CREATE POLICY "Read workflow logs" ON public.workflow_logs
    FOR SELECT USING (
        is_admin_user()
    );

-- 4. Repopulate hospitals data for the recommendation feature
TRUNCATE TABLE public.hospitals CASCADE;

INSERT INTO public.hospitals (name, city, address, lat, lng, phone, emergency, rating) VALUES
    ('Sidarth Hospitals',              'Medchal',      'P.No.196, Mythri Nagar, Medchal',                   17.6250, 78.4850, '040-20202000', TRUE,  4.5),
    ('Suvidha Hospitals',              'Medchal',      'H.No: A31-4, Sy No : 321, G V Heights, Medchal',  17.6280, 78.4870, '080195-55554', TRUE,  4.4),
    ('Gouda Ramesh ENT Hospital',      'Medchal',      '3rd Floor, KKR Building, Y Junction, Kukatpally',   17.4930, 78.4050, '040-12345678', FALSE, 4.3),
    ('American Laser Eye Hospital',    'Medchal',      'Madeenguda, Medchal',                               17.4950, 78.3300, '040-98765432', FALSE, 4.6),
    ('S-Cure Hospitals',               'Medchal',      'East Gandhi Nagar, Rampally Road, Nagaram',         17.4800, 78.6050, '072228-99799', TRUE,  4.2),
    ('Dr Baigs Baba Eye Hospital',     'Medchal',      'H.NO:739/1, Ghatkesar, Medchal',                    17.4500, 78.6800, '098854-18409', FALSE, 4.1),
    ('Meditech Multispeciality Hosp.','Medchal',      'Beerappa Nagar, Jagathgirigutta, Quthbullapur',     17.5150, 78.4200, '040-33334444', TRUE,  4.5),
    ('Medinova Super Speciality',      'Medchal',      'H No. 13-254, Opp. Asian Mukund, Nh-44, Medchal',   17.6300, 78.4800, '040-55556666', TRUE,  4.7),
    ('Navya Nursing Home',             'Medchal',      'Uma Nagar Colony, Secunderabad, Medchal',           17.6350, 78.4820, '084182-21234', TRUE,  4.0),
    ('Hope Hospital',                  'Medchal',      'National Highway 44, R T C Colony, Medchal',        17.6400, 78.4800, '077995-82007', TRUE,  4.8);

-- Make sure hospitals are publically readable
DROP POLICY IF EXISTS "Anyone can view hospitals" ON public.hospitals;
DROP POLICY IF EXISTS "Public read hospitals" ON public.hospitals;
CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);
