-- Create restaurant_owners table to link merchants to their restaurants
CREATE TABLE public.restaurant_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

-- Enable RLS on restaurant_owners
ALTER TABLE public.restaurant_owners ENABLE ROW LEVEL SECURITY;

-- Admins can manage all restaurant ownership
CREATE POLICY "Admins can manage restaurant owners"
ON public.restaurant_owners
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Merchants can view their own ownership records
CREATE POLICY "Merchants can view their own ownership"
ON public.restaurant_owners
FOR SELECT
USING (auth.uid() = user_id);

-- Create helper function to check restaurant ownership
CREATE OR REPLACE FUNCTION public.owns_restaurant(_user_id UUID, _restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_owners
    WHERE user_id = _user_id
      AND restaurant_id = _restaurant_id
  )
$$;

-- Drop old policies on orders
DROP POLICY IF EXISTS "Merchants can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Merchants can update orders" ON public.orders;

-- New orders SELECT policy: admins see all, merchants see only their restaurants
CREATE POLICY "Merchants can view their restaurant orders"
ON public.orders
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.owns_restaurant(auth.uid(), restaurant_id)
);

-- New orders UPDATE policy: admins can update all, merchants only their restaurants
CREATE POLICY "Merchants can update their restaurant orders"
ON public.orders
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.owns_restaurant(auth.uid(), restaurant_id)
);

-- Update restaurants policies: merchants can only manage their own restaurants
DROP POLICY IF EXISTS "Merchants can update restaurants" ON public.restaurants;

CREATE POLICY "Merchants can update their own restaurants"
ON public.restaurants
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.owns_restaurant(auth.uid(), id)
);

-- Update menu_items policies: merchants can only manage items for their restaurants
DROP POLICY IF EXISTS "Merchants can update menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Merchants can create menu items" ON public.menu_items;

CREATE POLICY "Merchants can update their restaurant menu items"
ON public.menu_items
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.owns_restaurant(auth.uid(), restaurant_id)
);

CREATE POLICY "Merchants can create their restaurant menu items"
ON public.menu_items
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') 
  OR public.owns_restaurant(auth.uid(), restaurant_id)
);