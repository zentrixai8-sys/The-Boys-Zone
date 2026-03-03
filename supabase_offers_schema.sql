-- Create offers table
CREATE TABLE public.offers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    image_url text COLLATE pg_catalog."default" NOT NULL,
    link text COLLATE pg_catalog."default",
    created_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT offers_pkey PRIMARY KEY (id)
);

-- Note: We assume public.categories already exists. If not, it should look like:
-- CREATE TABLE public.categories (
--     category_id uuid NOT NULL DEFAULT uuid_generate_v4(),
--     category_name text COLLATE pg_catalog."default" NOT NULL,
--     image_url text COLLATE pg_catalog."default" NOT NULL,
--     CONSTRAINT categories_pkey PRIMARY KEY (category_id)
-- );
