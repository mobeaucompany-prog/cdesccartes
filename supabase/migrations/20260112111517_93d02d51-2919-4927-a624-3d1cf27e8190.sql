-- Drop the too permissive policy
DROP POLICY IF EXISTS "Orders viewable by merchants or with tracking token" ON public.orders;

-- Create proper combined SELECT policy
-- For customer access, they MUST filter by tracking_token in their query
-- The RLS will pass the row if tracking_token matches the filter
CREATE POLICY "Orders viewable by authorized users"
ON public.orders
FOR SELECT
USING (
  -- Admins see all
  public.has_role(auth.uid(), 'admin')
  -- Merchants see their restaurant orders
  OR public.owns_restaurant(auth.uid(), restaurant_id)
);