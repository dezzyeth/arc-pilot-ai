import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  CalendarClock, CheckCircle2, Copy, KeyRound, Loader2, Play, Power, Sparkles, Trash2, Wallet, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import {
  useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { AgentWalletCard, useAgentWallet } from "@/components/agent-wallet-card";
import { ExplorerLink } from "@/components/explorer-link";
import { Input } from "@/components/ui/input";
import { WalletBadge } from "@/components/wallet-badge";
import { X402JobForm } from "@/components/x402-job-form";
import { supabase } from "@/integrations/supabase/client";
import { ARC_CHAIN_ID } from "@/lib/chains";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { generatePlannerSuggestion } from "@/lib/planner-plan.functions";
import {
  arcPublicClient, clearSessionKey, createSessionKey, getSessionKey,
  sessionAccount, sessionWalletClient,
} from "@/lib/session-key";
import { ACTION_FEE_USDC, useActionFee } from "@/lib/use-action-fee";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/app/planner")({
  component: PlannerPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Planner" },
      { name: "description", content: "Auto-executing scheduled & conditional transactions on Arc Testnet." },
    ],
  }),
});

type Row = {
  id: string;
  wallet: string;
  to_addr: string;
  amount_usdc: number;
  memo: string | null;
  kind: "scheduled" | "conditional";
  run_at: string | null;
  condition: string | null;
  status: "pending" | "executed" | "cancelled";
  tx_hash: string | null;
  created_at: string;
};

function PlannerPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrong = mounted && isConnected && chainId !== ARC_CHAIN_ID;

  const [rows, setRows] = useState<Row[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  // form state
  const [tab, setTab] = useState<"onchain" | "x402">("onchain");
  const [kind, setKind] = useState<"scheduled" | "conditional">("scheduled");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [runAt, setRunAt] = useState("");
  const [condition, setCondition] = useState("balance>1");
  const [saving, setSaving] = useState(false);
  const [fundAmt, setFundAmt] = useState("0.05");

  const { data: balance } = useBalance({ address, chainId: ARC_CHAIN_ID, query: { enabled: !!address && !wrong } });
  const balUsdc = balance ? Number(formatUnits(balance.value, 18)) : 0;

  // ─── Session key (auto-sign burner) ─────────────────────────────
  const [sessionPk, setSessionPk] = useState<`0x${string}` | null>(null);
  useEffect(() => {
    if (!address) return;
    setSessionPk(getSessionKey(address));
  }, [address]);
  const sessionAddr = useMemo(
    () => (sessionPk ? sessionAccount(sessionPk).address : null),
    [sessionPk],
  );
  const [sessionBal, setSessionBal] = useState<bigint>(0n);
  useEffect(() => {
    if (!sessionAddr) return setSessionBal(0n);
    let alive = true;
    const load = async () => {
      try {
        const b = await arcPublicClient.getBalance({ address: sessionAddr });
        if (alive) setSessionBal(b);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 15_000);
    return () => { alive = false; clearInterval(id); };
  }, [sessionAddr]);

  const enableSession = () => {
    if (!address) return;
    const pk = createSessionKey(address);
    setSessionPk(pk);
    toast.success("Auto-sign session key created");
  };
  const disableSession = () => {
    if (!address) return;
    clearSessionKey(address);
    setSessionPk(null);
    toast.message("Session key removed");
  };

  const { sendTransactionAsync } = useSendTransaction();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  useWaitForTransactionReceipt({ hash: pendingHash, chainId: ARC_CHAIN_ID, query: { enabled: !!pendingHash } });

  async function fundSession(amountUsdc: string) {
    if (!address || !sessionAddr) return;
    if (!/^\d+(\.\d+)?$/.test(amountUsdc) || Number(amountUsdc) <= 0) {
      return toast.error("Enter a positive amount");
    }
    try {
      await ensureArcChain();
      const hash = await sendTransactionAsync({
        to: sessionAddr,
        value: parseUnits(amountUsdc, 18),
        chainId: ARC_CHAIN_ID,
      });
      setPendingHash(hash);
      toast.success(`Funding session key with ${amountUsdc} USDC`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Funding failed");
    }
  }

  async function refresh() {
    if (!address) return;
    const { data } = await supabase
      .from("scheduled_tx")
      .select("*")
      .eq("wallet", address.toLowerCase())
      .order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const { payFee, paying } = useActionFee();
  const suggestFn = useServerFn(generatePlannerSuggestion);
  const [suggestion, setSuggestion] = useState<string>("");
  const [suggesting, setSuggesting] = useState(false);

  async function askForSuggestion() {
    if (!address) return toast.error("Connect wallet");
    try {
      setSuggesting(true);
      const [{ data: budgets }, { data: goals }] = await Promise.all([
        supabase.from("budgets").select("category, monthly_limit_usdc").eq("wallet", address.toLowerCase()),
        supabase.from("goals").select("name, target_usdc, saved_usdc, deadline").eq("wallet", address.toLowerCase()),
      ]);
      const { plan } = await suggestFn({
        data: {
          kind, to, amount, memo, runAt, condition,
          balanceUsdc: balUsdc,
          budgets: (budgets ?? []).map((b) => ({
            category: b.category as string,
            limit: Number(b.monthly_limit_usdc),
          })),
          goals: (goals ?? []).map((g) => ({
            name: g.name as string,
            target: Number(g.target_usdc),
            saved: Number(g.saved_usdc),
            deadline: (g.deadline as string | null) ?? null,
          })),
        },
      });
      setSuggestion(plan);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get suggestion");
    } finally {
      setSuggesting(false);
    }
  }


  async function createPlan() {
    if (!address) return toast.error("Connect wallet");
    if (!isAddress(to)) return toast.error("Invalid recipient");
    if (!/^\d+(\.\d+)?$/.test(amount) || Number(amount) <= 0) return toast.error("Invalid amount");
    if (kind === "scheduled" && !runAt) return toast.error("Pick a run time");
    const hash = await payFee(
      kind === "scheduled" ? "PLAN_SCHED" : "PLAN_COND",
      `Create ${kind} plan · ${amount} USDC`,
    );
    if (!hash) return;
    setSaving(true);
    const { error } = await supabase.from("scheduled_tx").insert({
      wallet: address.toLowerCase(),
      to_addr: to.toLowerCase(),
      amount_usdc: Number(amount),
      memo: memo || null,
      kind,
      run_at: kind === "scheduled" ? new Date(runAt).toISOString() : null,
      condition: kind === "conditional" ? condition : null,
      status: "pending",
    });
    await supabase.from("tx_log").insert({
      wallet: address.toLowerCase(),
      hash,
      to_addr: null,
      amount_usdc: Number(ACTION_FEE_USDC),
      category: kind === "conditional" ? "conditional" : "scheduled",
      memo: `Plan ${amount} USDC → ${to.slice(0, 6)}…`,
      explanation: "One-transaction fee to register a plan on Arc Testnet.",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Plan created — will auto-execute when due");
    setTo(""); setAmount(""); setMemo(""); setRunAt("");
    refresh();
  }

  function conditionMet(row: Row, bal: number): boolean {
    if (row.kind !== "conditional" || !row.condition) return false;
    const m = row.condition.match(/^balance(>|<|>=|<=|==)([\d.]+)$/);
    if (!m) return false;
    const op = m[1], v = Number(m[2]);
    if (op === ">") return bal > v;
    if (op === "<") return bal < v;
    if (op === ">=") return bal >= v;
    if (op === "<=") return bal <= v;
    return bal === v;
  }
  function isDue(row: Row): boolean {
    if (row.kind !== "scheduled" || !row.run_at) return false;
    return new Date(row.run_at).getTime() <= Date.now();
  }

  async function executeRow(row: Row, opts?: { silent?: boolean }) {
    if (!address) return;
    try {
      setBusyId(row.id);
      let hash: `0x${string}`;

      if (sessionPk) {
        // Auto-sign path: burner wallet, no MetaMask popup.
        const wc = sessionWalletClient(sessionPk);
        hash = await wc.sendTransaction({
          to: row.to_addr as Address,
          value: parseUnits(String(row.amount_usdc), 18),
        });
      } else {
        // Fallback: prompt MetaMask.
        await ensureArcChain();
        hash = await sendTransactionAsync({
          to: row.to_addr as Address,
          value: parseUnits(String(row.amount_usdc), 18),
          chainId: ARC_CHAIN_ID,
        });
        setPendingHash(hash);
      }

      await supabase
        .from("scheduled_tx")
        .update({ status: "executed", tx_hash: hash })
        .eq("id", row.id);
      await supabase.from("tx_log").insert({
        wallet: address.toLowerCase(),
        hash,
        to_addr: row.to_addr,
        amount_usdc: row.amount_usdc,
        category: row.kind === "conditional" ? "conditional" : "scheduled",
        memo: row.memo,
        explanation: `${opts?.silent ? "Auto-executed" : "Executed"} ${row.kind} plan${row.condition ? ` (${row.condition})` : ""}${sessionPk ? " via session key" : ""}.`,
      });
      toast.success(opts?.silent ? `Auto-executed ${row.amount_usdc} USDC` : "Executed on-chain");
      refresh();
    } catch (e) {
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "Failed");
      else console.error("auto-execute failed", e);
    } finally {
      setBusyId(null);
    }
  }

  // ─── Auto-execute scheduler ────────────────────────────────────
  const runningRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!address || wrong) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      // Fetch balance fresh for conditional evaluation
      let liveBal = balUsdc;
      if (sessionPk && sessionAddr) {
        // if using session key, use its balance for conditional relative to *sender*
        try {
          const b = await arcPublicClient.getBalance({ address: sessionAddr });
          liveBal = Number(formatUnits(b, 18));
        } catch { /* ignore */ }
      } else if (address) {
        try {
          const b = await arcPublicClient.getBalance({ address });
          liveBal = Number(formatUnits(b, 18));
        } catch { /* ignore */ }
      }
      for (const r of rows) {
        if (r.status !== "pending") continue;
        if (runningRef.current.has(r.id)) continue;
        const ready = isDue(r) || conditionMet(r, liveBal);
        if (!ready) continue;
        // Only auto-fire silently when session key is available; otherwise
        // still fire but MetaMask will prompt (still "automatic trigger").
        runningRef.current.add(r.id);
        await executeRow(r, { silent: true });
        runningRef.current.delete(r.id);
      }
    };
    // Run immediately then interval
    tick();
    const id = setInterval(tick, 10_000);
    return () => { cancelled = true; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, address, wrong, sessionPk, sessionAddr]);

  async function cancel(row: Row) {
    await supabase.from("scheduled_tx").update({ status: "cancelled" }).eq("id", row.id);
    refresh();
  }
  async function remove(row: Row) {
    await supabase.from("scheduled_tx").delete().eq("id", row.id);
    refresh();
  }

  if (!mounted || !isConnected) {
    return (
      <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center">
        <Wallet className="mx-auto h-8 w-8 text-[color:var(--brand-2)]" />
        <h2 className="mt-4 text-2xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Connect on Arc Testnet to use the planner.</p>
      </div>
    );
  }

  const sessionBalUsdc = Number(formatUnits(sessionBal, 18));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Planner</h1>
        <p className="text-sm text-muted-foreground">
          Plans auto-execute the moment they're due or their condition is met — keep this tab open.
        </p>
      </motion.div>

      {/* Session key card */}
      <div className="glass mt-4 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[color:var(--brand-2)]" />
            <div>
              <div className="text-sm font-medium">Auto-sign session key</div>
              <div className="text-[11px] text-muted-foreground">
                {sessionPk
                  ? "Enabled — executions sign silently, no MetaMask popup."
                  : "Off — auto-executions will prompt MetaMask each time."}
              </div>
            </div>
          </div>
          {sessionPk ? (
            <Button size="sm" variant="secondary" onClick={disableSession} className="rounded-full">
              <Power className="mr-1 h-3 w-3" /> Disable
            </Button>
          ) : (
            <Button size="sm" onClick={enableSession} className="rounded-full">
              <KeyRound className="mr-1 h-3 w-3" /> Enable auto-sign
            </Button>
          )}
        </div>
        {sessionPk && sessionAddr && (
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="rounded-xl border border-border/60 p-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Session address:</span>
                <code className="truncate">{sessionAddr}</code>
                <button
                  className="rounded p-1 hover:bg-white/10"
                  onClick={() => { navigator.clipboard.writeText(sessionAddr); toast.success("Copied"); }}
                  title="Copy"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-1 text-muted-foreground">
                Balance: <span className="text-foreground">{sessionBalUsdc.toFixed(6)} USDC</span> ·
                needs enough to cover future plan amounts + gas.
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={fundAmt}
                onChange={(e) => setFundAmt(e.target.value)}
                className="w-28"
                placeholder="0.05"
              />
              <Button size="sm" onClick={() => fundSession(fundAmt)} className="rounded-full">
                Fund
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-3 flex gap-2">
            <button
              onClick={() => setKind("scheduled")}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm",
                kind === "scheduled" ? "bg-[image:var(--gradient-brand)] text-primary-foreground" : "glass",
              )}
            >
              <CalendarClock className="mr-2 inline h-4 w-4" /> Scheduled
            </button>
            <button
              onClick={() => setKind("conditional")}
              className={cn(
                "flex-1 rounded-xl px-3 py-2 text-sm",
                kind === "conditional" ? "bg-[image:var(--gradient-brand)] text-primary-foreground" : "glass",
              )}
            >
              <Zap className="mr-2 inline h-4 w-4" /> Conditional
            </button>
          </div>
          <div className="space-y-3">
            <Input placeholder="Recipient 0x…" value={to} onChange={(e) => setTo(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Amount USDC" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Input placeholder="Memo (optional)" value={memo} onChange={(e) => setMemo(e.target.value)} />
            </div>
            {kind === "scheduled" ? (
              <Input type="datetime-local" value={runAt} onChange={(e) => setRunAt(e.target.value)} />
            ) : (
              <Input
                placeholder="e.g. balance>1 or balance<0.5"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
            )}
            <Button onClick={createPlan} disabled={saving || paying} className="w-full rounded-xl shadow-glow">
              {saving || paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create plan · {ACTION_FEE_USDC} USDC
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Each plan is registered with 1 on-chain transaction ({ACTION_FEE_USDC} USDC).
              When it becomes due, ArcPilot auto-fires the transfer — silently if the
              session key is enabled and funded.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={askForSuggestion}
              disabled={suggesting}
              className="w-full rounded-xl"
            >
              {suggesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4 text-[color:var(--brand-2)]" />
              )}
              {suggestion ? "Refresh AI suggestion" : "Get AI suggestion"}
            </Button>
            {suggestion && (
              <div className="prose prose-invert prose-sm mt-1 max-w-none rounded-xl border border-white/10 bg-black/30 p-3 prose-headings:mt-3 prose-headings:mb-1 prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestion}</ReactMarkdown>
              </div>
            )}

          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-muted-foreground">Your plans</h2>
          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No plans yet — create one to get started.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.map((r) => {
                const ready = r.status === "pending" && (isDue(r) || conditionMet(r, balUsdc));
                return (
                  <li key={r.id} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {r.kind === "scheduled" ? (
                            <CalendarClock className="h-3.5 w-3.5" />
                          ) : (
                            <Zap className="h-3.5 w-3.5" />
                          )}
                          {r.amount_usdc} USDC → {r.to_addr.slice(0, 6)}…{r.to_addr.slice(-4)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {r.kind === "scheduled"
                            ? `Runs ${r.run_at ? new Date(r.run_at).toLocaleString() : "—"}`
                            : `Trigger: ${r.condition}`}
                          {r.memo ? ` · ${r.memo}` : ""}
                        </div>
                        {r.status === "pending" && (
                          <div className="mt-1 text-[10px] text-[color:var(--brand-2)]">
                            {ready
                              ? busyId === r.id ? "Auto-executing…" : "Ready — firing next tick"
                              : "Waiting for trigger · auto-fires when ready"}
                          </div>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                          r.status === "pending" && "bg-accent/60",
                          r.status === "executed" && "bg-[color:var(--success)]/20 text-[color:var(--success)]",
                          r.status === "cancelled" && "bg-destructive/20 text-destructive",
                        )}
                      >
                        {r.status}
                      </span>
                    </div>
                    {r.status === "pending" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => executeRow(r)}
                          variant="secondary"
                          className="rounded-full"
                          title="Fire now"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="mr-1 h-3 w-3" />
                          )}
                          Run now
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => cancel(r)} className="rounded-full">
                          Cancel
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(r)} className="rounded-full">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {r.status === "executed" && r.tx_hash && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[color:var(--success)]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Executed · {r.tx_hash.slice(0, 10)}…</span>
                        <ExplorerLink value={r.tx_hash} kind="tx" className="ml-auto" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
