-- Add the orders table to the Supabase Realtime publication
-- This enables our website to listen for new orders and show real-time notifications to the admin
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
