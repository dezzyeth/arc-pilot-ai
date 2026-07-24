CREATE TABLE public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evm_address text UNIQUE NOT NULL,
  circle_wallet_id text UNIQUE,
  circle_wallet_address text,
  circle_wallet_set_id text,
  blockchain text NOT NULL DEFAULT 'ETH-SEPOLIA',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_wallets TO anon, authenticated;
GRANT ALL ON public.user_wallets TO service_role;

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read wallet mappings"
  ON public.user_wallets FOR SELECT
  USING (true);

CREATE INDEX user_wallets_evm_address_idx ON public.user_wallets (evm_address);