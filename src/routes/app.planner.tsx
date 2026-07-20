import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Loader2, Play, Trash2, Wallet, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import {
  useAccount, useBalance, useChainId, useSendTransaction, useWaitForTransactionReceipt,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ARC_CHAIN_ID } from "@/lib/chains";
import { ensureArcChain } from "@/lib/ensure-arc-chain";
import { ACTION_FEE_USDC, useActionFee } from "@/lib/use-action-fee";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/planner")({
  component: PlannerPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Planner" },
      { name: "description", content: "Schedule & conditional transactions on Arc Testnet." },
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
  const [kind, setKind] = useState<"scheduled" | "conditional">("scheduled");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [runAt, setRunAt] = useState("");
  const [condition, setCondition] = useState("balance>1");
  const [saving, setSaving] = useState(false);

  const { data: balance } = useBalance({ address, chainId: ARC_CHAIN_ID, query: { enabled: !!address && !wrong } });
  const balUsdc = balance ? Number(formatUnits(balance.value, 18)) : 0;

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
    toast.success("Plan created");
    setTo(""); setAmount(""); setMemo(""); setRunAt("");
    refresh();
  }

  const { sendTransactionAsync } = useSendTransaction();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  useWaitForTransactionReceipt({ hash: pendingHash, chainId: ARC_CHAIN_ID, query: { enabled: !!pendingHash } });

  async function execute(row: Row) {
    if (!address) return;
    try {
      await ensureArcChain();
      setBusyId(row.id);
      const hash = await sendTransactionAsync({
        to: row.to_addr as Address,
        value: parseUnits(String(row.amount_usdc), 18),
        chainId: ARC_CHAIN_ID,
      });
      setPendingHash(hash);
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
        explanation: `Executed ${row.kind} plan${row.condition ? ` (${row.condition})` : ""}.`,
      });
      toast.success("Executed on-chain");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(row: Row) {
    await supabase.from("scheduled_tx").update({ status: "cancelled" }).eq("id", row.id);
    refresh();
  }
  async function remove(row: Row) {
    await supabase.from("scheduled_tx").delete().eq("id", row.id);
    refresh();
  }

  function conditionMet(row: Row): boolean {
    if (row.kind !== "conditional" || !row.condition) return false;
    const m = row.condition.match(/^balance(>|<|>=|<=|==)([\d.]+)$/);
    if (!m) return false;
    const op = m[1], v = Number(m[2]);
    if (op === ">") return balUsdc > v;
    if (op === "<") return balUsdc < v;
    if (op === ">=") return balUsdc >= v;
    if (op === "<=") return balUsdc <= v;
    return balUsdc === v;
  }
  function isDue(row: Row): boolean {
    if (row.kind !== "scheduled" || !row.run_at) return false;
    return new Date(row.run_at).getTime() <= Date.now();
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Planner</h1>
        <p className="text-sm text-muted-foreground">
          Schedule future transfers or set balance-triggered conditional payments.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
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
              Each plan is registered with 1 on-chain transaction ({ACTION_FEE_USDC} USDC). Execution is
              a second transaction you confirm — ArcPilot never auto-signs.
            </p>
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
                const ready = r.status === "pending" && (isDue(r) || conditionMet(r));
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
                          disabled={busyId === r.id || !ready}
                          onClick={() => execute(r)}
                          className="rounded-full"
                          title={ready ? "Ready to execute" : "Not yet due / condition not met"}
                        >
                          {busyId === r.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="mr-1 h-3 w-3" />
                          )}
                          Execute
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
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-[color:var(--success)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Executed · {r.tx_hash.slice(0, 10)}…
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
