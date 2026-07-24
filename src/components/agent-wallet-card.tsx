import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Bot, Copy, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseUnits } from "viem";
import { useAccount, useSendTransaction } from "wagmi";

import { Button } from "@/components/ui/button";
import { ExplorerLink } from "@/components/explorer-link";
import { Input } from "@/components/ui/input";
import { WalletBadge } from "@/components/wallet-badge";
import { supabase } from "@/integrations/supabase/client";
import { ARC_CHAIN_ID } from "@/lib/chains";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { createAgentWallet, creditAgentBalance, updateAgentCaps } from "@/lib/agent-wallet.functions";

export type AgentWalletRow = {
  owner_wallet: string;
  agent_address: string;
  gateway_balance_usdc: number;
  spending_cap_usdc: number;
  cap_period: string;
  spent_in_period_usdc: number;
  period_started_at: string;
  expiry: string | null;
};

export function useAgentWallet() {
  const { address } = useAccount();
  const [row, setRow] = useState<AgentWalletRow | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!address) return setRow(null);
    setLoading(true);
    const { data } = await supabase
      .from("nanopayments_agent_wallet_public" as never)
      .select("*")
      .eq("owner_wallet", address.toLowerCase())
      .maybeSingle();
    setRow(((data as unknown) as AgentWalletRow) ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return { row, refresh, loading };
}

export function AgentWalletCard() {
  const { address } = useAccount();
  const { row, refresh } = useAgentWallet();
  const createFn = useServerFn(createAgentWallet);
  const updateFn = useServerFn(updateAgentCaps);
  const { sendTransactionAsync } = useSendTransaction();

  const [cap, setCap] = useState("0.05");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [expiryDays, setExpiryDays] = useState("30");
  const [fundAmt, setFundAmt] = useState("0.05");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!row) return;
    setCap(String(row.spending_cap_usdc));
    setPeriod(row.cap_period as "day" | "week" | "month");
    if (row.expiry) {
      const days = Math.max(
        1,
        Math.round((new Date(row.expiry).getTime() - Date.now()) / 86400_000),
      );
      setExpiryDays(String(days));
    }
  }, [row]);

  async function enable() {
    if (!address) return toast.error("Connect wallet");
    if (!/^\d+(\.\d+)?$/.test(cap) || Number(cap) <= 0)
      return toast.error("Enter a positive cap");
    try {
      setBusy("enable");
      const expiryIso = expiryDays
        ? new Date(Date.now() + Number(expiryDays) * 86400_000).toISOString()
        : null;
      await createFn({
        data: {
          ownerWallet: address.toLowerCase(),
          spendingCapUsdc: Number(cap),
          capPeriod: period,
          expiry: expiryIso,
        },
      });
      toast.success("Nanopayments agent wallet ready");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveCaps() {
    if (!address || !row) return;
    try {
      setBusy("caps");
      const expiryIso = expiryDays
        ? new Date(Date.now() + Number(expiryDays) * 86400_000).toISOString()
        : null;
      await updateFn({
        data: {
          ownerWallet: address.toLowerCase(),
          spendingCapUsdc: Number(cap),
          capPeriod: period,
          expiry: expiryIso,
        },
      });
      toast.success("Caps updated");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function fund() {
    if (!row) return;
    if (!/^\d+(\.\d+)?$/.test(fundAmt) || Number(fundAmt) <= 0)
      return toast.error("Enter a positive amount");
    try {
      setBusy("fund");
      await ensureArcChain();
      // On Arc, USDC is the native gas token — a native value transfer
      // to the agent address funds the agent's Gateway balance.
      const hash = await sendTransactionAsync({
        to: row.agent_address as `0x${string}`,
        value: parseUnits(fundAmt, 18),
        chainId: ARC_CHAIN_ID,
      });
      // Optimistically credit the on-record Gateway balance so the UI
      // reflects the deposit immediately.
      await creditFn({
        data: {
          ownerWallet: row.owner_wallet,
          amountUsdc: Number(fundAmt),
        },
      });
      if (address) {
        await supabase.from("tx_log").insert({
          wallet: address.toLowerCase(),
          hash,
          to_addr: row.agent_address,
          amount_usdc: Number(fundAmt),
          category: "agent_fund",
          memo: `Fund Nanopayments agent`,
          explanation:
            "One MetaMask signature: deposit USDC to the Nanopayments Agent Wallet on Arc Testnet. The agent draws from this balance to pay x402 endpoints within the caps you set.",
        });
      }
      toast.success(`Sent ${fundAmt} USDC to agent`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Funding failed");
    } finally {
      setBusy(null);
    }
  }

  if (!address) return null;

  const remaining = row
    ? Math.max(
        0,
        Number(row.spending_cap_usdc) - Number(row.spent_in_period_usdc),
      )
    : 0;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-300" />
          <h2 className="text-sm font-medium">Nanopayments Agent Wallet</h2>
        </div>
        <WalletBadge kind="agent" address={row?.agent_address} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        A dedicated agent wallet that autonomously pays x402 endpoints on
        Arc Testnet within your caps. Distinct from your MetaMask.
      </p>

      {!row ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 p-3 text-[11px] text-muted-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-300" />
              <span>
                Enabling creates a fresh agent address. You'll fund it in a
                separate step — this action does <b>not</b> move funds.
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Cap (USDC)</label>
              <Input value={cap} onChange={(e) => setCap(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="day">per day</option>
                <option value="week">per week</option>
                <option value="month">per month</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Expiry (days)</label>
              <Input value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={enable}
            disabled={busy === "enable"}
            className="w-full rounded-xl shadow-glow"
          >
            {busy === "enable" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Enable Nanopayments
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Agent balance" value={`${Number(row.gateway_balance_usdc).toFixed(4)} USDC`} highlight />
            <Stat
              label={`Remaining ${row.cap_period} cap`}
              value={`${remaining.toFixed(4)} USDC`}
            />
            <Stat
              label="Expires"
              value={row.expiry ? new Date(row.expiry).toLocaleDateString() : "never"}
            />
          </div>

          <div className="rounded-xl border border-border/60 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Agent address:</span>
              <code className="truncate">{row.agent_address}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(row.agent_address);
                  toast.success("Copied");
                }}
                className="rounded p-1 hover:bg-white/10"
              >
                <Copy className="h-3 w-3" />
              </button>
              <ExplorerLink value={row.agent_address} kind="address" className="ml-auto" />
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-medium text-muted-foreground">
              Fund Nanopayments (one MetaMask signature — moves USDC from your
              main wallet into the agent's Gateway balance)
            </div>
            <div className="flex gap-2">
              <Input value={fundAmt} onChange={(e) => setFundAmt(e.target.value)} placeholder="0.05" />
              <Button onClick={fund} disabled={busy === "fund"} className="rounded-xl">
                {busy === "fund" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Fund agent
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-medium text-muted-foreground">
              Caps & expiry (editable before funds move)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input value={cap} onChange={(e) => setCap(e.target.value)} />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as "day" | "week" | "month")}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="day">per day</option>
                <option value="week">per week</option>
                <option value="month">per month</option>
              </select>
              <Input value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
            </div>
            <Button
              onClick={saveCaps}
              variant="secondary"
              disabled={busy === "caps"}
              className="mt-2 w-full rounded-xl"
            >
              {busy === "caps" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save caps
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        "rounded-xl border border-border/60 p-3 " +
        (highlight ? "bg-purple-500/5" : "")
      }
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}
