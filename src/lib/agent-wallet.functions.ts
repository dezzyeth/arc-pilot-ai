// Client-callable server functions for the Nanopayments Agent Wallet.
//
// createAgentWallet — generates a fresh viem key, seals it, upserts a
// row keyed by owner_wallet, and returns the public address only.
// The private key never leaves the server.

import { createServerFn } from "@tanstack/react-start";

export const createAgentWallet = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      ownerWallet: string;
      spendingCapUsdc: number;
      capPeriod: "day" | "week" | "month";
      expiry?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      sealPrivateKey,
      newAgentPrivateKey,
      addressForPrivateKey,
    } = await import("@/lib/agent-wallet.server");

    const owner = data.ownerWallet.toLowerCase();

    // Reuse existing agent if it already exists — never rotate silently.
    const { data: existing } = await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .select("agent_address")
      .eq("owner_wallet", owner)
      .maybeSingle();

    if (existing?.agent_address) {
      // Update caps/expiry only.
      await supabaseAdmin
        .from("nanopayments_agent_wallet")
        .update({
          spending_cap_usdc: data.spendingCapUsdc,
          cap_period: data.capPeriod,
          expiry: data.expiry ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("owner_wallet", owner);
      return { agentAddress: existing.agent_address as string, created: false };
    }

    const pk = newAgentPrivateKey();
    const address = addressForPrivateKey(pk);
    const cipher = await sealPrivateKey(pk);

    const { error } = await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .insert({
        owner_wallet: owner,
        agent_address: address.toLowerCase(),
        agent_privkey_ciphertext: cipher,
        spending_cap_usdc: data.spendingCapUsdc,
        cap_period: data.capPeriod,
        expiry: data.expiry ?? null,
      });
    if (error) throw new Error(error.message);

    return { agentAddress: address, created: true };
  });

export const updateAgentCaps = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      ownerWallet: string;
      spendingCapUsdc: number;
      capPeriod: "day" | "week" | "month";
      expiry?: string | null;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .update({
        spending_cap_usdc: data.spendingCapUsdc,
        cap_period: data.capPeriod,
        expiry: data.expiry ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_wallet", data.ownerWallet.toLowerCase());
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Credit the agent's on-record Gateway balance after the user funds it
// from MetaMask. Writes to the base table are restricted to server-side
// (service_role) — the client cannot update this column directly.
export const creditAgentBalance = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { ownerWallet: string; amountUsdc: number }) => data,
  )
  .handler(async ({ data }) => {
    if (!Number.isFinite(data.amountUsdc) || data.amountUsdc <= 0) {
      throw new Error("Invalid amount");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const owner = data.ownerWallet.toLowerCase();
    const { data: row, error: readErr } = await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .select("gateway_balance_usdc")
      .eq("owner_wallet", owner)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Agent wallet not found");
    const next = Number(row.gateway_balance_usdc) + Number(data.amountUsdc);
    const { error } = await supabaseAdmin
      .from("nanopayments_agent_wallet")
      .update({ gateway_balance_usdc: next, updated_at: new Date().toISOString() })
      .eq("owner_wallet", owner);
    if (error) throw new Error(error.message);
    return { ok: true, balance: next };
  });
