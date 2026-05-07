-- Update ingredient images in customization_options for various option names
UPDATE menu_items
SET customization_options = jsonb_set(
  customization_options,
  '{option_groups}',
  (
    SELECT jsonb_agg(
      jsonb_set(
        g,
        '{options}',
        (
          SELECT jsonb_agg(
            CASE
              WHEN opt->>'name' = 'Pain Classique' THEN jsonb_set(opt, '{image}', '"/images/menu/pain-classique.png"')
              WHEN opt->>'name' = 'Tortilla' THEN jsonb_set(opt, '{image}', '"/images/menu/tortilla.png"')
              WHEN opt->>'name' = 'Cornichon' THEN jsonb_set(opt, '{image}', '"/images/menu/cornichon.png"')
              WHEN opt->>'name' = 'Galette de pomme de terre' THEN jsonb_set(opt, '{image}', '"/images/menu/galette-pomme-de-terre.png"')
              WHEN opt->>'name' = 'Oignon Frit' THEN jsonb_set(opt, '{image}', '"/images/menu/oignon-frit.png"')
              WHEN opt->>'name' = 'Salade' THEN jsonb_set(opt, '{image}', '"/images/menu/salade.png"')
              WHEN opt->>'name' = 'Tomate' THEN jsonb_set(opt, '{image}', '"/images/menu/tomate-fraiche.png"')
              ELSE opt
            END
          )
          FROM jsonb_array_elements(g->'options') opt
        )
      )
    )
    FROM jsonb_array_elements(customization_options->'option_groups') g
  )
)
WHERE customization_options IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(customization_options->'option_groups') g,
                  jsonb_array_elements(g->'options') opt
    WHERE opt->>'name' IN ('Pain Classique','Tortilla','Cornichon','Galette de pomme de terre','Oignon Frit','Salade','Tomate')
  );