CREATE TABLE public.payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route text NOT NULL,
  amount_usdc numeric NOT NULL,
  payer_addr text,
  seller_addr text NOT NULL,
  tx_ref text,
  network text NOT NULL DEFAULT 'arc-testnet',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.payment_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read payment_events" ON public.payment_events
  FOR SELECT USING (true);
CREATE POLICY "public insert payment_events" ON public.payment_events
  FOR INSERT WITH CHECK (true);

CREATE INDEX payment_events_created_at_idx ON public.payment_events (created_at DESC);
CREATE INDEX payment_events_route_idx ON public.payment_events (route);