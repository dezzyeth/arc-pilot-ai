# Part 2 — Buyer-side x402 Nanopayments

Build the buyer half of the x402 flow: an agent wallet the user funds once, Planner jobs that autonomously call paid endpoints, and full visibility in Portfolio + Reports. Arc Testnet + USDC only, matching the seller side already shipped.

## Data model (one migration)

Extend `payment_events` and add two tables. New rows keep RLS permissive to match the rest of the app.

- `payment_events` — add `direction` ('inbound' | 'outbound'), `endpoint` (text), `counterparty_address` (text), `status` (text, default 'success'), `response_snippet` (text), `job_id` (uuid, nullable). Existing seller-side inserts keep working (default `direction='inbound'`).
- `nanopayments_agent_wallet` — one row per user wallet: `owner_wallet`, `agent_address`, `agent_privkey_ciphertext` (encrypted with a per-owner key stored client-side; server only needs the address for cron), `gateway_balance_usdc`, `spending_cap_usdc`, `cap_period` ('day'|'week'|'month'), `spent_in_period_usdc`, `period_started_at`, `expiry`, `created_at`.
- `planner_x402_jobs` — `owner_wallet`, `agent_address`, `target_url`, `max_price_usdc`, `schedule_cron` (nullable), `next_run_at`, `condition` (nullable text, reuse Planner conditional format), `total_budget_usdc` (nullable), `spent_to_date_usdc`, `expected_price_usdc` (nullable, learned from first call for spike detection), `status` ('active'|'paused'|'exhausted'|'expired'), `last_run_at`, `last_error`.

## Agent wallet lifecycle

`src/lib/agent-wallet.ts` (client): generate a viem private key on first "Enable Nanopayments" click, encrypt with a passphrase-derived key, store ciphertext + address in `nanopayments_agent_wallet`. Provide `getAgentSigner(passphrase)` for signing EIP-3009 authorizations client-side when needed for verification.

Fund flow — new component `<FundAgentWalletDialog>` in Planner + Budgets:
1. Show cap/expiry inputs (period + amount + optional expiry) — editable, visible.
2. Explain in plain English what the signature does.
3. One MetaMask tx: USDC (native on Arc) transfer to Circle Gateway deposit address for the agent wallet. Use existing `ensureArcChain` + `useWriteContract`.
4. On confirm: upsert row, poll Gateway balance, show toast.

Persistent visual distinction: new `<WalletBadge kind="main"|"agent">` used in header, dashboard, portfolio. Main = MetaMask orange chip; Agent = purple "Nanopayments Agent" chip with cap remaining.

## Planner job type

Extend `src/routes/app.planner.tsx` with a third card "Pay x402 endpoint" alongside Scheduled/Conditional. Fields: URL, max price, schedule (interval dropdown → cron) OR condition, optional total budget. Preview shows expected first-call cost (fetches `/.well-known/x402` if available, else waits for first 402).

## Server-side executor

`src/routes/api/public/hooks/x402-runner.ts` — public cron endpoint (already-documented `/api/public/*` pattern, apikey header). Runs every minute via `pg_cron` + `pg_net`.

For each active job whose `next_run_at <= now()` (or whose condition evaluates true):
1. `fetch(target_url)` → expect 402.
2. Parse challenge, validate `payTo`, `network=='arc-testnet'`, `amount`.
3. Guards (all logged to `payment_events` as `status='rejected'` on failure):
   - `amount > job.max_price` → reject "price ceiling".
   - `job.spent_to_date + amount > job.total_budget` → mark job `exhausted`.
   - `wallet.spent_in_period + amount > wallet.spending_cap` → reject "cap".
   - `wallet.expiry < now()` → mark job `expired`.
   - Risk engine (reuse `src/lib/risk.ts` patterns): first-time endpoint → flag "unknown-endpoint"; `amount > 2 × expected_price` → flag "price-spike". Flags go into `payment_events.response_snippet` metadata; job still runs unless caps hit.
4. Load agent privkey from a server-side sealed table (see security note) OR sign client-side. Because the runner is server-only cron with no MetaMask, we store the agent key encrypted at rest and decrypt in the runner using a Supabase secret `AGENT_WALLET_ENCRYPTION_KEY`. Use viem `signTypedData` for EIP-3009 `transferWithAuthorization` (USDC on Arc supports this).
5. Retry `fetch` with `X-Payment: base64(payload)`.
6. On 200: increment `spent_to_date`, `spent_in_period`, decrement `gateway_balance`, set `next_run_at`. Insert `payment_events` row (`direction='outbound'`, `endpoint`, `counterparty_address`, `amount_usdc`, `response_snippet`, `status='success'`, `job_id`).
7. Also insert into `tx_log` with `category='nanopayment'` so Portfolio + Reports pick it up.

Schedule the cron in the same edit (`supabase--insert` with `cron.schedule`).

## Portfolio + Reports integration

- `src/routes/app.portfolio.tsx` — add "Nanopayments" section: agent wallet card (address, gateway balance, cap remaining, next reset), recent outbound x402 events. Existing tx list already reads `tx_log`; nanopayment rows show a distinct purple "Nanopayment" tag.
- `src/routes/app.reports.tsx` — add category breakdown row for `nanopayment`; AI narrative includes agent spend when >0. Seller earnings row already exists via `EarningsCard` on dashboard; mirror the summary numbers into Reports.

## New / edited files

New:
- `src/lib/agent-wallet.ts`, `src/lib/agent-wallet.server.ts` (seal/unseal + viem signer)
- `src/lib/x402-buyer.server.ts` (fetch-402-pay-retry loop, risk checks)
- `src/lib/risk-x402.ts` (unknown-endpoint + price-spike detection, mirrors existing risk shape)
- `src/routes/api/public/hooks/x402-runner.ts`
- `src/components/fund-agent-wallet-dialog.tsx`
- `src/components/wallet-badge.tsx`
- `src/components/agent-wallet-card.tsx`
- `src/components/x402-job-form.tsx`

Edited:
- `src/routes/app.planner.tsx` (third job type + list of x402 jobs)
- `src/routes/app.portfolio.tsx` (agent section, nanopayment tag)
- `src/routes/app.reports.tsx` (nanopayment category + seller/buyer summary)
- `src/routes/app.index.tsx` (agent wallet chip next to main wallet)
- `src/lib/x402-config.ts` (export atomic-price helpers for reuse buyer-side)

## Environment additions

- `AGENT_WALLET_ENCRYPTION_KEY` — generated server secret (via `generate_secret`) for at-rest sealing of agent private keys.
- `X402_SELLER_WALLET` (already documented) — used for the acceptance test targeting our own paid routes.

## Acceptance test (manual, documented in the manual page)

1. Enable Nanopayments in Planner → sign MetaMask deposit of 0.05 USDC → agent row shows balance + cap.
2. Create x402 job → target `https://<preview>/api/paid/insight`, max price 0.005, interval 2 min.
3. Wait one cycle → `payment_events` shows one inbound (seller) + one outbound (buyer) row for the same `tx_ref`, `tx_log` shows a Nanopayment entry, Reports shows non-zero nanopayment category, Earnings card increments.

## Security notes

- Agent private key sealed with `AGENT_WALLET_ENCRYPTION_KEY` (AES-GCM). Never returned to the client after creation; user re-derives from local passphrase to view/export.
- Runner is `/api/public/*` (bypasses site auth) but requires the Supabase `apikey` header, matching the existing cron pattern.
- Caps + expiry enforced BEFORE signing, not after — a compromised endpoint cannot drain more than `min(max_price, remaining cap, remaining budget)` per call, and only during the schedule window.
