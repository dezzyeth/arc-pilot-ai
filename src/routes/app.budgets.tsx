import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Plus, Shield, Target, Trash2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/budgets")({
  component: BudgetsPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Budgets & Goals" },
      { name: "description", content: "Budget protection & financial goals." },
    ],
  }),
});

type Budget = { id: string; category: string; monthly_limit_usdc: number };
type Goal = {
  id: string;
  name: string;
  target_usdc: number;
  saved_usdc: number;
  deadline: string | null;
};

function BudgetsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [spentByCat, setSpentByCat] = useState<Record<string, number>>({});

  const [bCat, setBCat] = useState("");
  const [bLimit, setBLimit] = useState("");
  const [gName, setGName] = useState("");
  const [gTarget, setGTarget] = useState("");
  const [gDeadline, setGDeadline] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!address) return;
    const w = address.toLowerCase();
    const [b, g, tx] = await Promise.all([
      supabase.from("budgets").select("*").eq("wallet", w),
      supabase.from("goals").select("*").eq("wallet", w),
      supabase
        .from("tx_log")
        .select("category, amount_usdc, created_at")
        .eq("wallet", w)
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        ),
    ]);
    setBudgets((b.data as Budget[]) ?? []);
    setGoals((g.data as Goal[]) ?? []);
    const map: Record<string, number> = {};
    (tx.data ?? []).forEach((r: { category: string | null; amount_usdc: number }) => {
      const k = r.category || "transfer";
      map[k] = (map[k] || 0) + Number(r.amount_usdc);
    });
    setSpentByCat(map);
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function addBudget() {
    if (!address || !bCat || !bLimit) return;
    setBusy(true);
    const { error } = await supabase.from("budgets").insert({
      wallet: address.toLowerCase(),
      category: bCat.toLowerCase(),
      monthly_limit_usdc: Number(bLimit),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBCat(""); setBLimit("");
    refresh();
  }
  async function addGoal() {
    if (!address || !gName || !gTarget) return;
    setBusy(true);
    const { error } = await supabase.from("goals").insert({
      wallet: address.toLowerCase(),
      name: gName,
      target_usdc: Number(gTarget),
      saved_usdc: 0,
      deadline: gDeadline || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setGName(""); setGTarget(""); setGDeadline("");
    refresh();
  }
  async function delBudget(id: string) {
    await supabase.from("budgets").delete().eq("id", id);
    refresh();
  }
  async function delGoal(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    refresh();
  }
  async function addToGoal(g: Goal, delta: number) {
    await supabase
      .from("goals")
      .update({ saved_usdc: Math.max(0, Number(g.saved_usdc) + delta) })
      .eq("id", g.id);
    refresh();
  }

  if (!mounted || !isConnected) {
    return (
      <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center">
        <Wallet className="mx-auto h-8 w-8 text-[color:var(--brand-2)]" />
        <h2 className="mt-4 text-2xl font-semibold">Connect your wallet</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets & Goals</h1>
        <p className="text-sm text-muted-foreground">
          Set monthly spend caps and savings goals. ArcPilot warns you before you break either.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-[color:var(--brand-2)]" /> Budget protection
          </h2>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input placeholder="Category (e.g. gaming)" value={bCat} onChange={(e) => setBCat(e.target.value)} />
            <Input placeholder="Monthly USDC limit" value={bLimit} onChange={(e) => setBLimit(e.target.value)} />
            <Button onClick={addBudget} disabled={busy} className="rounded-xl">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {budgets.length === 0 && (
              <p className="text-xs text-muted-foreground">No budgets yet.</p>
            )}
            {budgets.map((b) => {
              const spent = spentByCat[b.category] || 0;
              const pct = Math.min(100, (spent / Number(b.monthly_limit_usdc)) * 100);
              const over = pct >= 100;
              return (
                <li key={b.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{b.category}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs", over && "text-destructive")}>
                        {spent.toFixed(2)} / {Number(b.monthly_limit_usdc).toFixed(2)} USDC
                      </span>
                      <button onClick={() => delBudget(b.id)} className="text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent/40">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        over ? "bg-destructive" : "bg-[image:var(--gradient-brand)]",
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-[color:var(--brand-2)]" /> Financial goals
          </h2>
          <div className="space-y-2">
            <Input placeholder="Goal name" value={gName} onChange={(e) => setGName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Target USDC" value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
              <Input type="date" value={gDeadline} onChange={(e) => setGDeadline(e.target.value)} />
            </div>
            <Button onClick={addGoal} disabled={busy} className="w-full rounded-xl">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add goal
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {goals.length === 0 && <p className="text-xs text-muted-foreground">No goals yet.</p>}
            {goals.map((g) => {
              const pct = Math.min(100, (Number(g.saved_usdc) / Number(g.target_usdc)) * 100);
              return (
                <li key={g.id} className="rounded-xl border border-border/60 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <button onClick={() => delGoal(g.id)} className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Number(g.saved_usdc).toFixed(2)} / {Number(g.target_usdc).toFixed(2)} USDC
                    {g.deadline ? ` · by ${g.deadline}` : ""}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-accent/40">
                    <div className="h-full rounded-full bg-[image:var(--gradient-brand)]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => addToGoal(g, 0.1)} className="rounded-full text-[11px]">
                      +0.1
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => addToGoal(g, 1)} className="rounded-full text-[11px]">
                      +1
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => addToGoal(g, -0.1)} className="rounded-full text-[11px]">
                      −0.1
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
