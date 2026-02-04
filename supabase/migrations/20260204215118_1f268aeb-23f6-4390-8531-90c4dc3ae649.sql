-- Add new columns for restaurant details
ALTER TABLE restaurants
ADD COLUMN adresse text,
ADD COLUMN telephone text,
ADD COLUMN horaires jsonb DEFAULT '{}'::jsonb;