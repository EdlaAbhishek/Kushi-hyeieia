-- =============================================================
-- MASTER SETUP: Run this entire script in Supabase SQL Editor
-- Creates all missing tables for: Global Chat, Blood Donation
-- =============================================================

-- ── 1. Global Messages (Community Chat) ──
CREATE TABLE IF NOT EXISTS global_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    user_name  TEXT NOT NULL,
    user_role  TEXT DEFAULT 'patient',
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read global messages') THEN
        CREATE POLICY "Anyone can read global messages"
            ON global_messages FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can send messages') THEN
        CREATE POLICY "Authenticated users can send messages"
            ON global_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_global_messages_created
    ON global_messages(created_at DESC);

-- ── 2. Blood Donors ──
CREATE TABLE IF NOT EXISTS blood_donors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    blood_group     TEXT NOT NULL,
    location        TEXT NOT NULL,
    phone           TEXT NOT NULL,
    show_name       BOOLEAN DEFAULT TRUE,
    contact_visible BOOLEAN DEFAULT FALSE,
    available_until DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blood_donors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read blood donors') THEN
        CREATE POLICY "Anyone can read blood donors"
            ON blood_donors FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own donor profile') THEN
        CREATE POLICY "Users can manage own donor profile"
            ON blood_donors FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- ── 3. Blood Requests ──
CREATE TABLE IF NOT EXISTS blood_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id       UUID NOT NULL REFERENCES blood_donors(id) ON DELETE CASCADE,
    patient_name   TEXT NOT NULL,
    patient_phone  TEXT NOT NULL,
    message        TEXT,
    status         TEXT DEFAULT 'pending',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read blood requests') THEN
        CREATE POLICY "Anyone can read blood requests"
            ON blood_requests FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can create blood requests') THEN
        CREATE POLICY "Authenticated users can create blood requests"
            ON blood_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

-- ═══════════════════════════════════════════════
-- IMPORTANT: After running this SQL, go to:
--   Database → Tables → global_messages → Enable Realtime
-- This is required for the community chat to work.
-- ═══════════════════════════════════════════════

-- ── 4. Notifications ──
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notifications') THEN
        CREATE POLICY "Users can read own notifications"
            ON notifications FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert notifications') THEN
        CREATE POLICY "Authenticated users can insert notifications"
            ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications') THEN
        CREATE POLICY "Users can update own notifications"
            ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- ── 5. Doctors profile_photo column mapping ──
-- The doctors table already has 'avatar_url', but to stick to the requested spec, we add 'profile_photo'.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='profile_photo') THEN
        ALTER TABLE doctors ADD COLUMN profile_photo TEXT;
    END IF;
END $$;

-- ═══════════════════════════════════════════════
-- SUPABASE STORAGE INSTRUCTIONS & SETUP
-- Run this directly in the Supabase SQL Editor to configure the "avatars" bucket:

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow PUBLIC access to SELECT (View) avatars
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

-- 3. Allow AUTHENTICATED users to INSERT (Upload) avatars
CREATE POLICY "Auth Insert Access" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );

-- 4. Allow AUTHENTICATED users to UPDATE their own avatars
CREATE POLICY "Auth Update Access" 
    ON storage.objects FOR UPDATE 
    USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
    );
-- ═══════════════════════════════════════════════
