-- =========================================================================
-- FINAL FIX FOR PATIENTS TABLE FOREIGN KEY
-- =========================================================================

-- The patients table was created pointing to `users(id)` instead of `auth.users(id)`.
-- We need to drop the table and recreate it correctly, or drop the constraint and add a new one.
-- Since the schema might be fresh and `patients` is empty (or has test data), we can drop and recreate the constraint.

-- 1. Drop the incorrect foreign key constraint
ALTER TABLE public.patients
DROP CONSTRAINT IF EXISTS patients_id_fkey;

-- 2. Add the correct foreign key constraint to auth.users
ALTER TABLE public.patients
ADD CONSTRAINT patients_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Verify RLS policies are still intact
-- (They should be unaffected by dropping the constraint)
