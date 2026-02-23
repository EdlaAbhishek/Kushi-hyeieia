-- Supabase Auth & Triggers Setup 

-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'patient'
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'patient')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. RLS Policies for Profiles
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 4. Sample policies for doctors/hospitals/appointments
-- Allow public to see doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view doctors."
  ON public.doctors FOR SELECT
  USING ( true );

-- Appointments: Patient can see own, Doctor can see own
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own appointments."
  ON public.appointments FOR SELECT
  USING ( auth.uid() = patient_id OR auth.uid() = doctor_id );

CREATE POLICY "Patients can insert appointments."
  ON public.appointments FOR INSERT
  WITH CHECK ( auth.uid() = patient_id );

CREATE POLICY "Users can update own appointments."
  ON public.appointments FOR UPDATE
  USING ( auth.uid() = patient_id OR auth.uid() = doctor_id );
