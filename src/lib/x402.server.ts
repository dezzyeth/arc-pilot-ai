// Server-only x402 paywall helpers.
//
// Implements a minimal HTTP 402 challenge/verify flow modeled on the
// x402 spec (Coinbase / Circle Gateway). For each protected route:
//
//   1. If the incoming request has no `X-Payment` header, reply with
//      402 Payment Required and a JSON challenge describing what to pay.
//   2. If the header is present, verify it (real verifier or dev mode)
//      and, on success, log the event to `payment_events` and continue.
//
// Dev mode (no X402_VERIFIER_URL set): accepts any well-formed header
// whose payload matches (payTo == seller, network == arc-testnet,
// amount >= price). This lets you demo the paywall end-to-end without
// a live facilitator.

import { createClient } from "@supabase/supabase-js";

import {
  PAID_ROUTES,
  X402_NETWORK,
  X402_VERSION,
  getSellerWallet,
  getVerifierUrl,
  type PaidRoute,
} from "@/lib/x402-config";

type X402Payload = {
  x402Version?: number;
  scheme?: string;
  network?: string;
  payTo?: string;
  payer?: string;
  from?: string;
  amount?: string | number;
  maxAmount?: string | number;
  txRef?: string;
  transactionHash?: string;
  authorization?: unknown;
};

function toAtomic(usdc: number): string {
  // USDC uses 6 decimals in x402; Arc's native USDC is 18-dec but the
  // x402 challenge amount is quoted in USDC atomic (6). We publish 6.
  return Math.round(usdc * 1_000_000).toString();
}

export function build402Challenge(route: PaidRoute): Response {
  const info = PAID_ROUTES[route];
  const seller = getSellerWallet();
  const challenge = {
    x402Version: X402_VERSION,
    error: "Payment Required",
    accepts: [
      {
        scheme: "exact",
        network: X402_NETWORK,
        maxAmountRequired: toAtomic(info.priceUsdc),
        resource: route,
        description: info.description,
        mimeType: "application/json",
        payTo: seller,
        asset: "native-usdc",
        maxTimeoutSeconds: 60,
      },
    ],
  };
  return new Response(JSON.stringify(challenge), {
    status: 402,
    headers: {
      "content-type": "application/json",
      "x-payment-required": "1",
      "access-control-expose-headers": "x-payment-required",
    },
  });
}

function decodePaymentHeader(header: string): X402Payload | null {
  const raw = header.trim();
  if (!raw) return null;
  // Accept either raw JSON or base64(JSON)
  try {
    return JSON.parse(raw) as X402Payload;
  } catch {
    /* try base64 */
  }
  try {
    const decoded = globalThis.atob
      ? globalThis.atob(raw)
      : Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded) as X402Payload;
  } catch {
    return null;
  }
}

async function verifyRemote(
  verifierUrl: string,
  payload: X402Payload,
  route: PaidRoute,
): Promise<{ ok: boolean; txRef?: string; payer?: string; error?: string }> {
  try {
    const res = await fetch(verifierUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        x402Version: X402_VERSION,
        network: X402_NETWORK,
        resource: route,
        payload,
      }),
    });
    if (!res.ok) return { ok: false, error: `verifier ${res.status}` };
    const data = (await res.json()) as {
      valid?: boolean;
      txRef?: string;
      transactionHash?: string;
      payer?: string;
    };
    if (!data.valid) return { ok: false, error: "verifier rejected" };
    return {
      ok: true,
      txRef: data.txRef ?? data.transactionHash,
      payer: data.payer,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "verifier error" };
  }
}

function verifyDev(
  payload: X402Payload,
  route: PaidRoute,
): { ok: boolean; txRef?: string; payer?: string; error?: string } {
  const seller = getSellerWallet();
  const info = PAID_ROUTES[route];
  const priceAtomic = BigInt(toAtomic(info.priceUsdc));

  const payTo = (payload.payTo ?? "").toString().toLowerCase();
  if (payTo !== seller) return { ok: false, error: "payTo mismatch" };
  if (payload.network && payload.network !== X402_NETWORK) {
    return { ok: false, error: "network mismatch" };
  }
  const amountRaw = payload.amount ?? payload.maxAmount ?? "0";
  let amt: bigint;
  try {
    amt = BigInt(String(amountRaw).split(".")[0]);
  } catch {
    return { ok: false, error: "amount invalid" };
  }
  if (amt < priceAtomic) return { ok: false, error: "amount too low" };

  return {
    ok: true,
    txRef: payload.txRef ?? payload.transactionHash,
    payer: (payload.payer ?? payload.from ?? "").toString().toLowerCase() || undefined,
  };
}

async function logPaymentEvent(args: {
  route: PaidRoute;
  amountUsdc: number;
  payer?: string;
  txRef?: string;
}) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    await client.from("payment_events").insert({
      route: args.route,
      amount_usdc: args.amountUsdc,
      payer_addr: args.payer ?? null,
      seller_addr: getSellerWallet(),
      tx_ref: args.txRef ?? null,
      network: X402_NETWORK,
    });
  } catch (err) {
    console.error("payment_events log failed", err);
  }
}

/**
 * Guard a paid API route.
 * Returns `null` on successful payment (caller proceeds to serve response),
 * or a Response (402 challenge / 400 / 402 verify-failed) that MUST be returned.
 */
export async function requirePayment(
  request: Request,
  route: PaidRoute,
): Promise<Response | null> {
  const header = request.headers.get("x-payment") ?? request.headers.get("X-Payment");
  if (!header) return build402Challenge(route);

  const payload = decodePaymentHeader(header);
  if (!payload) {
    return new Response(JSON.stringify({ error: "invalid X-Payment header" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const verifierUrl = getVerifierUrl();
  const result = verifierUrl
    ? await verifyRemote(verifierUrl, payload, route)
    : verifyDev(payload, route);

  if (!result.ok) {
    const challenge = build402Challenge(route);
    const body = await challenge.json();
    return new Response(
      JSON.stringify({ ...body, error: `Payment invalid: ${result.error ?? "unknown"}` }),
      { status: 402, headers: { "content-type": "application/json" } },
    );
  }

  await logPaymentEvent({
    route,
    amountUsdc: PAID_ROUTES[route].priceUsdc,
    payer: result.payer,
    txRef: result.txRef,
  });

  return null;
}
