-- =====================================================
-- FIX 1: Restrict restaurants table write access to merchants/admins
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can manage restaurants" ON public.restaurants;

-- Create merchant-only INSERT policy
CREATE POLICY "Merchants can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- Create merchant-only UPDATE policy
CREATE POLICY "Merchants can update restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- Create admin-only DELETE policy
CREATE POLICY "Admins can delete restaurants" 
ON public.restaurants 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FIX 2: Restrict menu_items table write access to merchants/admins
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can manage menu items" ON public.menu_items;

-- Create merchant-only INSERT policy
CREATE POLICY "Merchants can create menu items" 
ON public.menu_items 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- Create merchant-only UPDATE policy
CREATE POLICY "Merchants can update menu items" 
ON public.menu_items 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- Create admin-only DELETE policy
CREATE POLICY "Admins can delete menu items" 
ON public.menu_items 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FIX 3: Restrict orders table access
-- =====================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
-- Keep the INSERT policy as anyone can create orders (customers)

-- Add tracking token for customer order lookup
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_token TEXT DEFAULT encode(gen_random_bytes(16), 'hex');

-- Create merchant-only SELECT policy
CREATE POLICY "Merchants can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- Create merchant-only UPDATE policy
CREATE POLICY "Merchants can update orders" 
ON public.orders 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'merchant') OR public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- FIX 4: Create server-side order validation function
-- =====================================================

-- Create a secure function to create orders with server-side price calculation
CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_client_name text,
  p_items jsonb,
  p_pickup_time text,
  p_restaurant_id uuid
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calculated_total decimal(10,2);
  v_order public.orders;
  v_item_count integer;
BEGIN
  -- Validate client name
  IF p_client_name IS NULL OR trim(p_client_name) = '' THEN
    RAISE EXCEPTION 'Client name is required';
  END IF;
  
  -- Validate items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
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
  
  IF v_item_count < jsonb_array_length(p_items) THEN
    RAISE EXCEPTION 'Some menu items do not exist';
  END IF;
  
  -- Insert with validated price
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
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.create_order_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_secure TO anon;