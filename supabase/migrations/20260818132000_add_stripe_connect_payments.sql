-- Additive Stripe Connect payment support. Existing restaurant/menu data is untouched.
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stripe_account_id text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_status_check
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session_id ON public.orders(stripe_checkout_session_id);

-- Existing orders receive the default "paid" value. New Stripe orders are immediately
-- switched to "pending" by the checkout edge function. Authenticated restaurant users
-- cannot read them until the signed Stripe webhook confirms payment.
DROP POLICY IF EXISTS "stripe_paid_orders_only" ON public.orders;
CREATE POLICY "stripe_paid_orders_only"
ON public.orders
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (payment_status = 'paid');
