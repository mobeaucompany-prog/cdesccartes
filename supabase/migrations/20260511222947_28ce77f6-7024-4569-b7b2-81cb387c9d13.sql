
UPDATE menu_items SET image = CASE nom
  WHEN 'Jus Goyave' THEN '/images/menu/jus-goyave.png'
  WHEN 'Jus Mangue' THEN '/images/menu/jus-mangue.png'
  WHEN 'San Pellegrino 50cl' THEN '/images/menu/san-pellegrino-50cl.png'
  WHEN 'Selecto' THEN '/images/menu/selecto.png'
END
WHERE restaurant_id = (SELECT id FROM restaurants WHERE nom = 'Les Lumières')
  AND categorie = 'Soft'
  AND nom IN ('Jus Goyave','Jus Mangue','San Pellegrino 50cl','Selecto');
