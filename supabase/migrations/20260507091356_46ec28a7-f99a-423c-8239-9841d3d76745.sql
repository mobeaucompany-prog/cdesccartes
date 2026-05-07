
CREATE OR REPLACE FUNCTION public.create_order_secure(p_client_name text, p_items jsonb, p_pickup_time text, p_restaurant_id uuid)
 RETURNS orders
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_calculated_total decimal(10,2);
  v_order public.orders;
  v_item_count integer;
  v_item jsonb;
  v_recent_count integer;
BEGIN
  -- Validate client name
  IF p_client_name IS NULL OR trim(p_client_name) = '' THEN
    RAISE EXCEPTION 'Client name is required';
  END IF;

  IF length(trim(p_client_name)) > 100 THEN
    RAISE EXCEPTION 'Client name must be 100 characters or less';
  END IF;

  -- Validate pickup time format (HH:MM)
  IF p_pickup_time IS NULL OR p_pickup_time !~ '^[0-2][0-9]:[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Invalid pickup time format. Use HH:MM';
  END IF;

  -- Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'Order cannot contain more than 100 line items';
  END IF;

  -- Validate each item structure and quantity
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    IF NOT (v_item ? 'id') THEN
      RAISE EXCEPTION 'Each item must have an id';
    END IF;

    IF v_item ? 'quantity' THEN
      IF (v_item->>'quantity')::int <= 0 OR (v_item->>'quantity')::int > 999 THEN
        RAISE EXCEPTION 'Item quantity must be between 1 and 999';
      END IF;
    END IF;
  END LOOP;

  -- Rate limiting: max 10 orders per restaurant per minute
  SELECT COUNT(*) INTO v_recent_count
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
    AND created_at > now() - interval '1 minute';

  IF v_recent_count >= 10 THEN
    RAISE EXCEPTION 'Too many orders for this restaurant in a short time. Please try again in a moment.';
  END IF;

  -- Calculate actual total from menu_items table prices
  SELECT COALESCE(SUM(
    COALESCE((item->>'quantity')::int, 1) * m.prix
  ), 0)
  INTO v_calculated_total
  FROM jsonb_array_elements(p_items) AS item
  JOIN menu_items m ON m.id = (item->>'id')::uuid;

  -- Verify all items exist
  SELECT COUNT(DISTINCT item->>'id')
  INTO v_item_count
  FROM jsonb_array_elements(p_items) AS item
  JOIN menu_items m ON m.id = (item->>'id')::uuid;

  IF v_item_count < (SELECT COUNT(DISTINCT item->>'id') FROM jsonb_array_elements(p_items) AS item) THEN
    RAISE EXCEPTION 'Some menu items do not exist';
  END IF;

  INSERT INTO public.orders (
    client_name,
    items_list,
    total_price,
    pickup_time,
    restaurant_id,
    status
  )
  VALUES (
    trim(p_client_name),
    p_items,
    v_calculated_total,
    p_pickup_time,
    p_restaurant_id,
    'pending'
  )
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$function$;
