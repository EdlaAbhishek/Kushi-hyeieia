-- Create the patients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (Recommended but optional depending on your app setup)
-- If you need RLS, uncomment these lines:
/*
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile" 
ON public.patients FOR INSERT 
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can read their own profile" 
ON public.patients FOR SELECT 
USING ( auth.uid() = id );
*/
