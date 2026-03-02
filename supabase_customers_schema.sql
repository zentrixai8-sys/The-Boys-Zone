-- 1. Create the customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    address TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for public access (assuming standard anon key usage for walk-in management)
CREATE POLICY "Enable read access for all" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON customers FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON customers FOR DELETE USING (true);
