
UPDATE menu_items SET image = CASE nom
  WHEN 'Citronnade' THEN '/images/menu/citronnade.png'
  WHEN 'Dada Cerise' THEN '/images/menu/dada-cerise.png'
  WHEN 'Dada Melon' THEN '/images/menu/dada-melon.png'
  WHEN 'Dada Pêche' THEN '/images/menu/dada-peche.png'
  WHEN 'Evian 50cl' THEN '/images/menu/evian-50cl.png'
  WHEN 'Dada Zero' THEN '/images/menu/dada-zero.png'
  WHEN 'Freeze Blue Hawai' THEN '/images/menu/freeze-blue-hawai.png'
END
WHERE restaurant_id = (SELECT id FROM restaurants WHERE nom = 'Les Lumières')
  AND categorie = 'Soft'
  AND nom IN ('Citronnade','Dada Cerise','Dada Melon','Dada Pêche','Evian 50cl','Dada Zero','Freeze Blue Hawai');
