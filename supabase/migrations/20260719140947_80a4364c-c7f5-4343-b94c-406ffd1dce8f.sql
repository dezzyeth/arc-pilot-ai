
-- Wallet-keyed tables (Arc Testnet demo — no auth; wallet address identifies rows)
CREATE TABLE public.tx_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  hash TEXT,
  direction TEXT NOT NULL DEFAULT 'out',
  to_addr TEXT,
  amount_usdc NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'transfer',
  memo TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tx_log_wallet_idx ON public.tx_log (wallet, created_at DESC);

CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_limit_usdc NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX budgets_wallet_idx ON public.budgets (wallet);

CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  name TEXT NOT NULL,
  target_usdc NUMERIC NOT NULL,
  saved_usdc NUMERIC NOT NULL DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX goals_wallet_idx ON public.goals (wallet);

CREATE TABLE public.scheduled_tx (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  amount_usdc NUMERIC NOT NULL,
  memo TEXT,
  kind TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'conditional'
  run_at TIMESTAMPTZ,
  condition TEXT,   -- e.g. 'balance>10'
  status TEXT NOT NULL DEFAULT 'pending', -- pending | executed | cancelled
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scheduled_tx_wallet_idx ON public.scheduled_tx (wallet, status);

CREATE TABLE public.ai_memory (
  wallet TEXT NOT NULL PRIMARY KEY,
  preferences TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants (anon-accessible; testnet demo, no auth)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tx_log TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_tx TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory TO anon, authenticated;
GRANT ALL ON public.tx_log, public.budgets, public.goals, public.scheduled_tx, public.ai_memory TO service_role;

ALTER TABLE public.tx_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tx ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

-- Testnet demo: permissive policies (row filtering happens client-side by wallet).
CREATE POLICY "public tx_log" ON public.tx_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public scheduled_tx" ON public.scheduled_tx FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public ai_memory" ON public.ai_memory FOR ALL USING (true) WITH CHECK (true);
