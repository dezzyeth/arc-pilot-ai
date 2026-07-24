// Server-side x402 buyer flow.
//
// Given a job row + agent wallet row, this module fetches a target
// URL, handles the 402 challenge, enforces per-call + per-period
// spending caps + risk checks, signs a lightweight EIP-191 payment
// authorization from the agent wallet, retries with the X-Payment
// header, and returns the outcome for logging.
//
// Note: the seller side (src/lib/x402.server.ts) accepts either raw
// JSON or base64(JSON) payloads. In DEV mode (no X402_VERIFIER_URL)
// it validates payTo + network + amount, which is sufficient for the
// acceptance test against our own paid routes. When a real Circle
// facilitator is configured, its stricter checks apply.

import { X402_NETWORK, X402_VERSION } from "@/lib/x402-config";
import { openPrivateKey } from "@/lib/agent-wallet.server";

type Challenge = {
  x402Version: number;
  accepts: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    payTo: string;
    asset: string;
    maxTimeoutSeconds: number;
  }>;
};

export type PayOutcome =
  | {
      ok: true;
      amountUsdc: number;
      payTo: string;
      responseSnippet: string;
      txRef?: string;
      warnings: string[];
    }
  | {
      ok: false;
      reason: string;
      amountUsdc?: number;
      payTo?: string;
    };

function atomicToUsdc(atomic: string | number): number {
  return Number(atomic) / 1_000_000;
}

export async function payX402Endpoint(args: {
  targetUrl: string;
  agentAddress: string;
  agentPrivkeyCiphertext: string;
  maxPriceUsdc: number;
  remainingBudgetUsdc: number | null;
  remainingCapUsdc: number;
  expectedPriceUsdc: number | null;
}): Promise<PayOutcome> {
  const {
    targetUrl,
    agentAddress,
    agentPrivkeyCiphertext,
    maxPriceUsdc,
    remainingBudgetUsdc,
    remainingCapUsdc,
    expectedPriceUsdc,
  } = args;

  // 1. Initial call — expect 402.
  let res: Response;
  try {
    res = await fetch(targetUrl, { method: "GET" });
  } catch (e) {
    return { ok: false, reason: `fetch failed: ${e instanceof Error ? e.message : "unknown"}` };
  }

  if (res.status !== 402) {
    // Free endpoint or unexpected shape — no payment made.
    const text = await res.text().catch(() => "");
    return {
      ok: true,
      amountUsdc: 0,
      payTo: "",
      responseSnippet: text.slice(0, 400),
      warnings: ["endpoint returned non-402; no payment required"],
    };
  }

  let challenge: Challenge;
  try {
    challenge = (await res.json()) as Challenge;
  } catch {
    return { ok: false, reason: "invalid 402 challenge body" };
  }

  const accept = challenge.accepts?.[0];
  if (!accept) return { ok: false, reason: "no accepts in challenge" };
  if (accept.network !== X402_NETWORK) {
    return { ok: false, reason: `wrong network: ${accept.network}` };
  }

  const amountUsdc = atomicToUsdc(accept.maxAmountRequired);
  const payTo = (accept.payTo ?? "").toLowerCase();

  // 2. Guard: hard price ceiling.
  if (amountUsdc > maxPriceUsdc) {
    return { ok: false, reason: `price ${amountUsdc} > job max ${maxPriceUsdc}`, amountUsdc, payTo };
  }
  // 3. Guard: total job budget.
  if (remainingBudgetUsdc !== null && amountUsdc > remainingBudgetUsdc) {
    return { ok: false, reason: `price ${amountUsdc} > remaining budget ${remainingBudgetUsdc}`, amountUsdc, payTo };
  }
  // 4. Guard: agent wallet spending cap for period.
  if (amountUsdc > remainingCapUsdc) {
    return { ok: false, reason: `price ${amountUsdc} > remaining cap ${remainingCapUsdc}`, amountUsdc, payTo };
  }

  const warnings: string[] = [];
  if (expectedPriceUsdc && amountUsdc > 2 * expectedPriceUsdc) {
    warnings.push(`price-spike: ${amountUsdc} > 2× expected ${expectedPriceUsdc}`);
  }

  // 5. Sign a payment payload. In dev-mode verification the seller
  //    accepts a JSON envelope with payTo/network/amount/payer. We
  //    also sign the amount+resource+payer as an EIP-191 message for
  //    provenance so a real verifier can later validate origin.
  const { privateKeyToAccount } = await import("viem/accounts");
  const pk = await openPrivateKey(agentPrivkeyCiphertext);
  const account = privateKeyToAccount(pk);

  const message = `x402|${accept.resource}|${accept.network}|${accept.maxAmountRequired}|${payTo}|${account.address.toLowerCase()}`;
  const signature = await account.signMessage({ message });
  const txRef = `agent:${account.address.toLowerCase()}:${Date.now()}`;

  const payload = {
    x402Version: X402_VERSION,
    scheme: accept.scheme,
    network: accept.network,
    resource: accept.resource,
    payTo,
    payer: account.address.toLowerCase(),
    from: account.address.toLowerCase(),
    amount: accept.maxAmountRequired,
    maxAmount: accept.maxAmountRequired,
    txRef,
    signature,
    message,
  };
  const headerVal = btoa(JSON.stringify(payload));

  // 6. Retry with X-Payment.
  let paidRes: Response;
  try {
    paidRes = await fetch(targetUrl, {
      method: "GET",
      headers: { "X-Payment": headerVal },
    });
  } catch (e) {
    return { ok: false, reason: `retry fetch failed: ${e instanceof Error ? e.message : "unknown"}`, amountUsdc, payTo };
  }

  const bodyText = await paidRes.text().catch(() => "");
  if (paidRes.status !== 200) {
    return {
      ok: false,
      reason: `paywall rejected (${paidRes.status}): ${bodyText.slice(0, 200)}`,
      amountUsdc,
      payTo,
    };
  }

  return {
    ok: true,
    amountUsdc,
    payTo,
    responseSnippet: bodyText.slice(0, 400),
    txRef,
    warnings,
  };
}

// Rolls the agent wallet's spending period boundary forward when the
// current period has elapsed, resetting the counter.
export function rollAgentPeriod(row: {
  cap_period: string;
  period_started_at: string;
  spent_in_period_usdc: number;
}): { spent_in_period_usdc: number; period_started_at: string } {
  const now = Date.now();
  const started = new Date(row.period_started_at).getTime();
  const ms =
    row.cap_period === "week"
      ? 7 * 86400_000
      : row.cap_period === "month"
        ? 30 * 86400_000
        : 86400_000;
  if (now - started >= ms) {
    return { spent_in_period_usdc: 0, period_started_at: new Date(now).toISOString() };
  }
  return { spent_in_period_usdc: row.spent_in_period_usdc, period_started_at: row.period_started_at };
}
