-- Extend payment_events for buyer-side (outbound) rows and job linkage
ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS counterparty_address text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS response_snippet text,
  ADD COLUMN IF NOT EXISTS job_id uuid;

-- Agent wallet (Nanopayments) — one row per owner wallet
CREATE TABLE IF NOT EXISTS public.nanopayments_agent_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet text NOT NULL UNIQUE,
  agent_address text NOT NULL,
  agent_privkey_ciphertext text NOT NULL,
  gateway_balance_usdc numeric NOT NULL DEFAULT 0,
  spending_cap_usdc numeric NOT NULL DEFAULT 0,
  cap_period text NOT NULL DEFAULT 'day',
  spent_in_period_usdc numeric NOT NULL DEFAULT 0,
  period_started_at timestamptz NOT NULL DEFAULT now(),
  expiry timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nanopayments_agent_wallet TO anon, authenticated;
GRANT ALL ON public.nanopayments_agent_wallet TO service_role;
ALTER TABLE public.nanopayments_agent_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public nanopayments_agent_wallet"
  ON public.nanopayments_agent_wallet FOR ALL
  TO public USING (true) WITH CHECK (true);

-- Planner x402 job type
CREATE TABLE IF NOT EXISTS public.planner_x402_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet text NOT NULL,
  agent_address text NOT NULL,
  target_url text NOT NULL,
  max_price_usdc numeric NOT NULL,
  schedule_cron text,
  interval_seconds integer,
  next_run_at timestamptz,
  condition text,
  total_budget_usdc numeric,
  spent_to_date_usdc numeric NOT NULL DEFAULT 0,
  expected_price_usdc numeric,
  status text NOT NULL DEFAULT 'active',
  last_run_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_x402_jobs TO anon, authenticated;
GRANT ALL ON public.planner_x402_jobs TO service_role;
ALTER TABLE public.planner_x402_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public planner_x402_jobs"
  ON public.planner_x402_jobs FOR ALL
  TO public USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS planner_x402_jobs_next_run_idx
  ON public.planner_x402_jobs (status, next_run_at);