-- Run this in your Supabase SQL Editor to fix the missing column
ALTER TABLE public.global_messages 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'patient';

-- To force Supabase API to refresh its schema cache, you can run this:
NOTIFY pgrst, 'reload schema';
