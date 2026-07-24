
-- Make the view respect caller permissions (fixes security_definer_view linter).
ALTER VIEW public.nanopayments_agent_wallet_public SET (security_invoker = true);

-- Column-scoped SELECT on the base table — ciphertext column excluded.
GRANT SELECT (
  id, owner_wallet, agent_address, gateway_balance_usdc,
  spending_cap_usdc, cap_period, spent_in_period_usdc,
  period_started_at, expiry, created_at, updated_at
) ON public.nanopayments_agent_wallet TO anon, authenticated;

-- Read-only RLS policy so the view can return rows under security_invoker.
CREATE POLICY "read non-sensitive agent wallet columns"
  ON public.nanopayments_agent_wallet
  FOR SELECT
  TO anon, authenticated
  USING (true);
