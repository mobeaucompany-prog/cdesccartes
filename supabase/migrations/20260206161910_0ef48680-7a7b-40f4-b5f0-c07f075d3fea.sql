-- Add variants column to menu_items for size options (Senior/Mega)
ALTER TABLE public.menu_items 
ADD COLUMN variants jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.menu_items.variants IS 'JSON array of size variants, e.g. [{"name": "Senior", "price": 10}, {"name": "Mega", "price": 15}]';