-- =====================================================================
-- COMPLETE FIX: Creating Admins Table & Dropping Broken Triggers
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================================

-- ═══════════════════════════════════════════════
-- STEP 1: DROP ALL BROKEN TRIGGERS ON auth.users
-- This is what causes "Database error querying schema" during login
-- ═══════════════════════════════════════════════

DO $$
DECLARE
  trg RECORD;
BEGIN
  FOR trg IN
    SELECT trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth'
      AND event_object_table = 'users'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trg.trigger_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;


-- ═══════════════════════════════════════════════
-- STEP 2: CREATE ADMINS TABLE
-- You requested a dedicated table for admins (like doctors/patients)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read admin profiles" ON public.admins;
CREATE POLICY "Anyone can read admin profiles" 
    ON public.admins FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update own profile" ON public.admins;
CREATE POLICY "Admins can update own profile" 
    ON public.admins FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow inserts for admins" ON public.admins;
CREATE POLICY "Allow inserts for admins" 
    ON public.admins FOR INSERT WITH CHECK (true);


-- ═══════════════════════════════════════════════
-- STEP 3: Ensure patients table has required columns
-- ═══════════════════════════════════════════════

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='role') THEN
        ALTER TABLE public.patients ADD COLUMN role TEXT DEFAULT 'patient';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='patients' AND column_name='avatar_url') THEN
        ALTER TABLE public.patients ADD COLUMN avatar_url TEXT;
    END IF;
END $$;


-- ═══════════════════════════════════════════════
-- STEP 4: CREATE / RESET THE ADMIN USER
-- This inserts the admin into auth.users AND public.admins
-- ═══════════════════════════════════════════════

DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@kushihygieia.app';

  IF uid IS NOT NULL THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt('247r1a66m4', gen_salt('bf')),
      raw_user_meta_data = '{"role":"admin","full_name":"System Administrator"}'::jsonb,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = uid;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(), 'authenticated', 'authenticated',
      'admin@kushihygieia.app',
      crypt('247r1a66m4', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin","full_name":"System Administrator"}'::jsonb,
      now(), now(), '', ''
    ) RETURNING id INTO uid;
  END IF;

  -- Insert/Update into the new ADMINS table
  INSERT INTO public.admins (id, full_name, email, role)
  VALUES (uid, 'System Administrator', 'admin@kushihygieia.app', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'System Administrator';

  -- Remove admin from patients table if they were added there previously
  DELETE FROM public.patients WHERE id = uid;
END $$;

-- ═══════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════
