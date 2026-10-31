-- The supplied cabinet photos show Oasis cassis framboise, not a generic raspberry drink.
-- Preserve the product ID, price, availability and all other restaurants.
UPDATE public.menu_items m
SET nom = 'Oasis cassis framboise'
WHERE m.restaurant_id = '977c4d48-3161-4845-94a3-6a7ef05c9f0e'
  AND m.nom = 'Oasis framboise'
  AND m.customization_options->>'creux_role' = 'soft'
  AND NOT EXISTS (
    SELECT 1 FROM public.menu_items other
    WHERE other.restaurant_id = m.restaurant_id
      AND other.nom = 'Oasis cassis framboise'
  );
