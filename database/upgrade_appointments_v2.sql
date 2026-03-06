-- Upgrade Appointment System: Doctor Availability and Video Sessions

-- 1. Add availability_status to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' 
CHECK (availability_status IN ('available', 'busy', 'offline'));

-- 2. Create video_sessions table
CREATE TABLE IF NOT EXISTS video_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
    doctor_peer_id TEXT,
    patient_peer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Realtime for video_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE video_sessions;

-- 4. RLS for video_sessions (Simple policy for now)
ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video sessions" 
ON video_sessions FOR SELECT 
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Users can insert video sessions" 
ON video_sessions FOR INSERT 
WITH CHECK (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Users can update their own video sessions" 
ON video_sessions FOR UPDATE 
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);
