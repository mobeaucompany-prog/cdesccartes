-- Add latitude and longitude columns to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL;

-- Update existing restaurants with sample coordinates (Campus Descartes area)
UPDATE public.restaurants SET latitude = 48.8412, longitude = 2.5877 WHERE nom = 'Bistro Descartes';
UPDATE public.restaurants SET latitude = 48.8425, longitude = 2.5890 WHERE nom = 'Pizza Roma';
UPDATE public.restaurants SET latitude = 48.8398, longitude = 2.5865 WHERE nom = 'Sushi Zen';