
UPDATE menu_items SET image = CASE nom
  WHEN 'Freeze Citron Gingembre' THEN '/images/menu/freeze-citron-gingembre.png'
  WHEN 'Freeze Grenadine' THEN '/images/menu/freeze-grenadine.png'
  WHEN 'Hamoud' THEN '/images/menu/hamoud.png'
END
WHERE restaurant_id = (SELECT id FROM restaurants WHERE nom = 'Les Lumières')
  AND categorie = 'Soft'
  AND nom IN ('Freeze Citron Gingembre','Freeze Grenadine','Hamoud');
