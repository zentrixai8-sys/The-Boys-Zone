-- SQL to add the missing 'images' column to the existing products table

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
