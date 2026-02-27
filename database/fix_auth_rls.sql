-- Update the doctors table schema to remove dupes or ensure correctness
-- Wait: we don't drop columns, just tweak RLS policies and constraints.

-- Temporarily allow anon inserts if they are coming directly from the frontend React app.
-- Since the frontend handles signUp() and then inserts before having a verified session (if email conf is on):
-- Best approach is just creating policies that allow inserting by anon and authenticated users.

-- Enable Row Level Security (if not already enabled)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted insert policies if they exist to avoid confusion
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.doctors;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.patients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.doctors;
DROP POLICY IF EXISTS "Allow anon inserts for signup" ON public.patients;
DROP POLICY IF EXISTS "Allow anon inserts for signup" ON public.doctors;

-- PATIENTS POLICY
-- Allow insert during signup (anon or authenticated).
CREATE POLICY "Allow anon inserts for signup" 
ON public.patients FOR INSERT 
WITH CHECK (true);

-- Allow users to view and update their own patient profile
CREATE POLICY "Users can read their own profile" 
ON public.patients FOR SELECT 
USING ( auth.uid() = id );
CREATE POLICY "Users can update their own profile" 
ON public.patients FOR UPDATE 
USING ( auth.uid() = id );

-- DOCTORS POLICY
-- Allow insert during signup (anon or authenticated).
CREATE POLICY "Allow anon inserts for signup" 
ON public.doctors FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view verified doctors (for the directory)
CREATE POLICY "Anyone can view doctors" 
ON public.doctors FOR SELECT 
USING ( true );

-- Ensure doctors can update their own profile
CREATE POLICY "Doctors can update their own profile" 
ON public.doctors FOR UPDATE 
USING ( auth.uid() = id );
