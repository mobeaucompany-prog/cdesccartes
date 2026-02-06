-- Add customization_options column to menu_items for configurable items like bowls
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS customization_options jsonb DEFAULT NULL;

COMMENT ON COLUMN public.menu_items.customization_options IS 'Stores customization option groups for configurable items like bowls';