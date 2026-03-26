
UPDATE menu_items
SET customization_options = jsonb_set(customization_options, '{option_groups}', (
  SELECT jsonb_agg(
    jsonb_set(g.val, '{options}', (
      SELECT jsonb_agg(
        CASE 
          WHEN o.val->>'name' = 'Artichaut' THEN o.val - 'image'
          ELSE o.val
        END
      )
      FROM jsonb_array_elements(g.val->'options') o(val)
    ))
  )
  FROM jsonb_array_elements(customization_options->'option_groups') g(val)
))
WHERE customization_options::text LIKE '%Artichaut%';
