-- SQL to add sub_category column to the products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category TEXT;
