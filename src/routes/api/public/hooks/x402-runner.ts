// Public cron endpoint that drives the buyer-side x402 executor.
//
// Runs every minute via pg_cron. For each active x402 job whose
// next_run_at <= now(), fetches the target, handles the 402 flow,
// enforces caps + risk checks, signs from the agent wallet, and
// logs to payment_events + tx_log so Portfolio/Reports pick it up.

import { createFileRoute } from "@tanstack/react-router";

import { getSellerWallet } from "@/lib/x402-config";
import { payX402Endpoint, rollAgentPeriod } from "@/lib/x402-buyer.server";

type Job = {
  id: string;
  owner_wallet: string;
  agent_address: string;
  target_url: string;
  max_price_usdc: number;
  interval_seconds: number | null;
  next_run_at: string | null;
  condition: string | null;
  total_budget_usdc: number | null;
  spent_to_date_usdc: number;
  expected_price_usdc: number | null;
  status: string;
  last_run_at: string | null;
};

type AgentWallet = {
  owner_wallet: string;
  agent_address: string;
  agent_privkey_ciphertext: string;
  spending_cap_usdc: number;
  cap_period: string;
  spent_in_period_usdc: number;
  period_started_at: string;
  expiry: string | null;
  gateway_balance_usdc: number;
};

export const Route = createFileRoute("/api/public/hooks/x402-runner")({
  server: {
    handlers: {
      POST: async () => runOnce(),
      GET: async () => runOnce(),
    },
  },
});

async function runOnce(): Promise<Response> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();

  const { data: jobsData, error: jobsErr } = await supabaseAdmin
    .from("planner_x402_jobs")
    .select("*")
    .eq("status", "active")
    .or(`next_run_at.is.null,next_run_at.lte.${nowIso}`)
    .limit(25);

  if (jobsErr) {
    return Response.json({ ok: false, error: jobsErr.message }, { status: 500 });
  }
  const jobs = (jobsData ?? []) as Job[];
  const results: unknown[] = [];

  for (const job of jobs) {
    try {
      results.push(await runJob(job, supabaseAdmin));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      await supabaseAdmin
        .from("planner_x402_jobs")
        .update({ last_error: msg, last_run_at: new Date().toISOString() })
        .eq("id", job.id);
      results.push({ jobId: job.id, ok: false, error: msg });
    }
  }

  return Response.json({ ok: true, processed: jobs.length, results });
}

async function runJob(
  job: Job,
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
): Promise<unknown> {
  const { data: walletData, error: wErr } = await supabaseAdmin
    .from("nanopayments_agent_wallet")
    .select("*")
    .eq("owner_wallet", job.owner_wallet)
    .maybeSingle();

  if (wErr || !walletData) {
    await supabaseAdmin
      .from("planner_x402_jobs")
      .update({ status: "paused", last_error: "agent wallet missing", last_run_at: new Date().toISOString() })
      .eq("id", job.id);
    return { jobId: job.id, ok: false, error: "agent wallet missing" };
  }
  const agent = walletData as AgentWallet;

  // Expiry check.
  if (agent.expiry && new Date(agent.expiry).getTime() <= Date.now()) {
    await supabaseAdmin
      .from("planner_x402_jobs")
      .update({ status: "expired", last_error: "agent wallet expired", last_run_at: new Date().toISOString() })
      .eq("id", job.id);
    return { jobId: job.id, ok: false, error: "agent expired" };
  }

  // Roll spending period boundary if elapsed.
  const rolled = rollAgentPeriod({
    cap_period: agent.cap_period,
    period_started_at: agent.period_started_at,
    spent_in_period_usdc: Number(agent.spent_in_period_usdc),
  });
  if (rolled.period_started_at !== agent.period_started_at) {
    await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .update({
        spent_in_period_usdc: 0,
        period_started_at: rolled.period_started_at,
      })
      .eq("owner_wallet", agent.owner_wallet);
    agent.spent_in_period_usdc = 0;
    agent.period_started_at = rolled.period_started_at;
  }

  const remainingCap = Math.max(
    0,
    Number(agent.spending_cap_usdc) - Number(agent.spent_in_period_usdc),
  );
  const remainingBudget =
    job.total_budget_usdc === null
      ? null
      : Math.max(0, Number(job.total_budget_usdc) - Number(job.spent_to_date_usdc));

  // Risk: unknown endpoint (first time we see this URL).
  const { count: seenBefore } = await supabaseAdmin
    .from("payment_events")
    .select("id", { count: "exact", head: true })
    .eq("endpoint", job.target_url)
    .eq("direction", "outbound")
    .eq("counterparty_address", getSellerWallet());
  const isUnknownEndpoint = (seenBefore ?? 0) === 0;

  const outcome = await payX402Endpoint({
    targetUrl: job.target_url,
    agentAddress: job.agent_address,
    agentPrivkeyCiphertext: agent.agent_privkey_ciphertext,
    maxPriceUsdc: Number(job.max_price_usdc),
    remainingBudgetUsdc: remainingBudget,
    remainingCapUsdc: remainingCap,
    expectedPriceUsdc: job.expected_price_usdc,
  });

  const nextRunAt = job.interval_seconds
    ? new Date(Date.now() + job.interval_seconds * 1000).toISOString()
    : null;

  if (!outcome.ok) {
    await supabaseAdmin.from("payment_events").insert({
      route: job.target_url,
      amount_usdc: outcome.amountUsdc ?? 0,
      payer_addr: job.agent_address,
      seller_addr: outcome.payTo ?? getSellerWallet(),
      network: "arc-testnet",
      direction: "outbound",
      endpoint: job.target_url,
      counterparty_address: outcome.payTo ?? null,
      status: "rejected",
      response_snippet: outcome.reason,
      job_id: job.id,
    });
    // If budget exhausted, mark job.
    const patch: Record<string, unknown> = {
      last_error: outcome.reason,
      last_run_at: new Date().toISOString(),
      next_run_at: nextRunAt,
    };
    if (outcome.reason.includes("remaining budget")) patch.status = "exhausted";
    await supabaseAdmin.from("planner_x402_jobs").update(patch).eq("id", job.id);
    return { jobId: job.id, ok: false, reason: outcome.reason };
  }

  const warnings = [...outcome.warnings];
  if (isUnknownEndpoint) warnings.unshift("unknown-endpoint (first-time payee)");

  // Log payment_events (outbound).
  await supabaseAdmin.from("payment_events").insert({
    route: job.target_url,
    amount_usdc: outcome.amountUsdc,
    payer_addr: job.agent_address,
    seller_addr: outcome.payTo,
    tx_ref: outcome.txRef ?? null,
    network: "arc-testnet",
    direction: "outbound",
    endpoint: job.target_url,
    counterparty_address: outcome.payTo,
    status: "success",
    response_snippet: `${warnings.length ? `[${warnings.join("; ")}] ` : ""}${outcome.responseSnippet}`,
    job_id: job.id,
  });

  // Mirror into tx_log so Portfolio + Reports pick it up.
  await supabaseAdmin.from("tx_log").insert({
    wallet: job.owner_wallet,
    hash: outcome.txRef ?? null,
    to_addr: outcome.payTo,
    amount_usdc: outcome.amountUsdc,
    category: "nanopayment",
    memo: `x402 · ${new URL(job.target_url).pathname}`,
    explanation: warnings.length
      ? `Autonomous nanopayment via Nanopayments Agent. Flags: ${warnings.join("; ")}.`
      : "Autonomous nanopayment via Nanopayments Agent Wallet.",
  });

  // Update wallet + job counters.
  const newSpentPeriod = Number(agent.spent_in_period_usdc) + outcome.amountUsdc;
  const newBalance = Math.max(0, Number(agent.gateway_balance_usdc) - outcome.amountUsdc);
  await supabaseAdmin
    .from("nanopayments_agent_wallet")
    .update({
      spent_in_period_usdc: newSpentPeriod,
      gateway_balance_usdc: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("owner_wallet", agent.owner_wallet);

  const newSpent = Number(job.spent_to_date_usdc) + outcome.amountUsdc;
  const newExpected =
    job.expected_price_usdc === null ? outcome.amountUsdc : Number(job.expected_price_usdc);
  const jobPatch: Record<string, unknown> = {
    spent_to_date_usdc: newSpent,
    expected_price_usdc: newExpected,
    last_run_at: new Date().toISOString(),
    last_error: null,
    next_run_at: nextRunAt,
  };
  if (
    job.total_budget_usdc !== null &&
    newSpent >= Number(job.total_budget_usdc)
  ) {
    jobPatch.status = "exhausted";
  }
  await supabaseAdmin.from("planner_x402_jobs").update(jobPatch).eq("id", job.id);

  return { jobId: job.id, ok: true, amountUsdc: outcome.amountUsdc };
}
