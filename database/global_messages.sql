-- =============================================================
-- Global Community Chat — Messages Table
-- Run this in Supabase SQL Editor, then enable Realtime
-- for the global_messages table in Database → Tables.
-- =============================================================

CREATE TABLE IF NOT EXISTS global_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL,
    user_name  TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row-Level Security
ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can read all messages
CREATE POLICY "Anyone can read global messages"
    ON global_messages FOR SELECT
    USING (true);

-- Only authenticated users can insert messages
CREATE POLICY "Authenticated users can send messages"
    ON global_messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Performance index for ordering by newest
CREATE INDEX IF NOT EXISTS idx_global_messages_created
    ON global_messages(created_at DESC);
