-- =====================================================================
-- STEP 1: RUN THIS FIRST — Shows all triggers on auth.users
-- Copy the output and share it so we can see what's there
-- =====================================================================

SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';
