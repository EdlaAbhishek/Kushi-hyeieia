-- Enable Realtime for the global_messages table
-- This allows the Supabase Javascript client to receive instant updates

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE global_messages;

-- Refresh the schema cache again just to be safe
NOTIFY pgrst, 'reload schema';
