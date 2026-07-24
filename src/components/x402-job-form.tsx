import { Loader2, Radio, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { ExplorerLink } from "@/components/explorer-link";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ACTION_FEE_USDC, useActionFee } from "@/lib/use-action-fee";
import { cn } from "@/lib/utils";

type Job = {
  id: string;
  target_url: string;
  max_price_usdc: number;
  interval_seconds: number | null;
  total_budget_usdc: number | null;
  spent_to_date_usdc: number;
  expected_price_usdc: number | null;
  status: string;
  last_run_at: string | null;
  last_error: string | null;
  next_run_at: string | null;
};

const INTERVAL_OPTIONS = [
  { label: "Every minute", seconds: 60 },
  { label: "Every 2 minutes", seconds: 120 },
  { label: "Every 15 minutes", seconds: 900 },
  { label: "Hourly", seconds: 3600 },
  { label: "Daily", seconds: 86400 },
];

export function X402JobForm({ agentAddress }: { agentAddress: string | null }) {
  const { address } = useAccount();
  const { payFee, paying } = useActionFee();

  const [url, setUrl] = useState("/api/paid/insight");
  const [maxPrice, setMaxPrice] = useState("0.005");
  const [interval, setInterval] = useState(120);
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  async function refresh() {
    if (!address) return;
    const { data } = await supabase
      .from("planner_x402_jobs")
      .select("*")
      .eq("owner_wallet", address.toLowerCase())
      .order("created_at", { ascending: false });
    setJobs((data as Job[]) ?? []);
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function create() {
    if (!address) return toast.error("Connect wallet");
    if (!agentAddress) return toast.error("Enable Nanopayments agent first");
    if (!/^https?:\/\/|^\//.test(url)) return toast.error("Invalid URL");
    if (!/^\d+(\.\d+)?$/.test(maxPrice) || Number(maxPrice) <= 0)
      return toast.error("Invalid max price");

    const feeHash = await payFee("X402_JOB", `Create x402 job → ${url}`);
    if (!feeHash) return;

    setSaving(true);
    const fullUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url}`;
    const { error } = await supabase.from("planner_x402_jobs").insert({
      owner_wallet: address.toLowerCase(),
      agent_address: agentAddress,
      target_url: fullUrl,
      max_price_usdc: Number(maxPrice),
      interval_seconds: interval,
      next_run_at: new Date(Date.now() + 5000).toISOString(),
      total_budget_usdc: budget ? Number(budget) : null,
      status: "active",
    });
    await supabase.from("tx_log").insert({
      wallet: address.toLowerCase(),
      hash: feeHash,
      to_addr: null,
      amount_usdc: Number(ACTION_FEE_USDC),
      category: "x402_job",
      memo: `New x402 job → ${url}`,
      explanation: "One-transaction fee to register an autonomous x402 payment job.",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("x402 job scheduled — first run in a few seconds");
    refresh();
  }

  async function toggle(job: Job) {
    await supabase
      .from("planner_x402_jobs")
      .update({ status: job.status === "active" ? "paused" : "active" })
      .eq("id", job.id);
    refresh();
  }
  async function remove(job: Job) {
    await supabase.from("planner_x402_jobs").delete().eq("id", job.id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-6">
        <div className="mb-3 flex items-center gap-2">
          <Radio className="h-4 w-4 text-purple-300" />
          <h2 className="text-sm font-medium">Pay x402 endpoint (autonomous)</h2>
        </div>
        {!agentAddress && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
            Enable the Nanopayments Agent Wallet above and fund it before
            scheduling a job.
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground">Target URL</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/api/paid/insight" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Max price / call</label>
              <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Schedule</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.seconds} value={o.seconds}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-muted-foreground">Total budget (optional)</label>
              <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0.10" />
            </div>
          </div>
          <Button
            onClick={create}
            disabled={saving || paying || !agentAddress}
            className="w-full rounded-xl shadow-glow"
          >
            {saving || paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create x402 job · {ACTION_FEE_USDC} USDC
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Runs on a server cron — no MetaMask needed at execution time. The
            agent hits the endpoint, receives the 402 challenge, and pays
            within your cap.
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-medium text-muted-foreground">Your x402 jobs</h2>
        {jobs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No x402 jobs yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {jobs.map((j) => (
              <li key={j.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Radio className="h-3.5 w-3.5 text-purple-300" />
                      <span className="truncate">{j.target_url}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Max {j.max_price_usdc} USDC · every {j.interval_seconds}s
                      {j.total_budget_usdc !== null
                        ? ` · budget ${j.total_budget_usdc} USDC (spent ${Number(j.spent_to_date_usdc).toFixed(4)})`
                        : ` · spent ${Number(j.spent_to_date_usdc).toFixed(4)} USDC`}
                    </div>
                    {j.expected_price_usdc && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        Expected price: {Number(j.expected_price_usdc).toFixed(6)} USDC
                      </div>
                    )}
                    {j.last_error && (
                      <div className="mt-1 text-[11px] text-destructive">
                        Last error: {j.last_error}
                      </div>
                    )}
                    {j.last_run_at && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        Last run: {new Date(j.last_run_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                      j.status === "active" && "bg-purple-500/20 text-purple-200",
                      j.status === "paused" && "bg-accent/60",
                      j.status === "exhausted" && "bg-destructive/20 text-destructive",
                      j.status === "expired" && "bg-destructive/20 text-destructive",
                    )}
                  >
                    {j.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggle(j)}
                    className="rounded-full"
                  >
                    {j.status === "active" ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(j)}
                    className="rounded-full"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {j.target_url && (
                    <ExplorerLink
                      value={j.target_url}
                      kind="tx"
                      variant="icon"
                      className="ml-auto opacity-0 pointer-events-none"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
