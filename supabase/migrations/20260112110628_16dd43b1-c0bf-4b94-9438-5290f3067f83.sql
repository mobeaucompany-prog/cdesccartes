-- Add policy allowing customers to view their order using tracking_token
CREATE POLICY "Customers can view their order with tracking token"
ON public.orders
FOR SELECT
USING (
  tracking_token IS NOT NULL 
  AND tracking_token = current_setting('request.headers', true)::json->>'x-tracking-token'
);