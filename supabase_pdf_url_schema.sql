-- Add the pdf_url column to store_sales table
ALTER TABLE public.store_sales
ADD COLUMN pdf_url text COLLATE pg_catalog."default";
