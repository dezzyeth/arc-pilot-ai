
-- Remove the overly permissive policy and public grants on the agent wallet table.
DROP POLICY IF EXISTS "public nanopayments_agent_wallet" ON public.nanopayments_agent_wallet;
REVOKE ALL ON public.nanopayments_agent_wallet FROM anon, authenticated, PUBLIC;

-- Only service_role (server-side admin client) can touch the base table.
GRANT ALL ON public.nanopayments_agent_wallet TO service_role;

-- Deny-by-default: RLS stays on, no policies for anon/authenticated.
-- (No CREATE POLICY needed; service_role bypasses RLS.)

-- Safe public view that excludes agent_privkey_ciphertext.
CREATE OR REPLACE VIEW public.nanopayments_agent_wallet_public AS
SELECT id,
       owner_wallet,
       agent_address,
       gateway_balance_usdc,
       spending_cap_usdc,
       cap_period,
       spent_in_period_usdc,
       period_started_at,
       expiry,
       created_at,
       updated_at
FROM public.nanopayments_agent_wallet;

GRANT SELECT ON public.nanopayments_agent_wallet_public TO anon, authenticated;
