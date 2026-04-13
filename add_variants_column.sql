-- SQL Migration to add variants column to products table
-- This column stores color/size/stock combinations in JSONB format
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
