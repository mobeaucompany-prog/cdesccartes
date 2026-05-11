
UPDATE menu_items SET image = CASE nom
  WHEN 'Virgin Mojito' THEN '/images/menu/virgin-mojito.png'
  WHEN 'Virgin Mojito Fraise' THEN '/images/menu/virgin-mojito-fraise.png'
  WHEN 'Virgin Mojito Framboise' THEN '/images/menu/virgin-mojito-framboise.png'
END
WHERE restaurant_id = (SELECT id FROM restaurants WHERE nom = 'Les Lumières')
  AND categorie = 'Cocktail'
  AND nom IN ('Virgin Mojito','Virgin Mojito Fraise','Virgin Mojito Framboise');
