-- SQL to drop and recreate the store_sales table for the new Billing module

-- First, drop the existing table AND its policies
DROP TABLE IF EXISTS store_sales CASCADE;

-- Now recreate the table with the new schema
CREATE TABLE store_sales (
    sale_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id TEXT NOT NULL, -- To group multiple items under one bill
    customer_name TEXT,
    customer_mobile TEXT,
    category TEXT,
    product_name TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    item_total NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all" ON store_sales FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON store_sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON store_sales FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON store_sales FOR DELETE USING (true);
