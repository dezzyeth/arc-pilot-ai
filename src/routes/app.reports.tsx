import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CalendarDays, Loader2, Sparkles, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ACTION_FEE_USDC, useActionFee } from "@/lib/use-action-fee";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Reports" },
      { name: "description", content: "Weekly & monthly AI-generated finance reports." },
    ],
  }),
});

type Range = "week" | "month";

type TxRow = {
  amount_usdc: number;
  category: string | null;
  memo: string | null;
  to_addr: string | null;
  created_at: string;
};

function ReportsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();

  const [range, setRange] = useState<Range>("week");
  const [rows, setRows] = useState<TxRow[]>([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const { payFee, paying } = useActionFee();

  useEffect(() => {
    if (!address) return;
    const since = new Date();
    since.setDate(since.getDate() - (range === "week" ? 7 : 30));
    supabase
      .from("tx_log")
      .select("amount_usdc, category, memo, to_addr, created_at")
      .eq("wallet", address.toLowerCase())
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as TxRow[]) ?? []));
  }, [address, range]);

  const total = rows.reduce((s, r) => s + Number(r.amount_usdc), 0);
  const byCat = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.category || "transfer";
    acc[k] = (acc[k] || 0) + Number(r.amount_usdc);
    return acc;
  }, {});

  async function generateReport() {
    if (rows.length === 0) return toast.error("No activity to summarize.");
    const hash = await payFee("REPORT", `Generate ${range} report`);
    if (!hash) return;
    if (address) {
      await supabase.from("tx_log").insert({
        wallet: address.toLowerCase(),
        hash,
        to_addr: null,
        amount_usdc: Number(ACTION_FEE_USDC),
        category: "report",
        memo: `AI ${range} report`,
        explanation: "One-transaction fee to generate an AI finance report.",
      });
    }
    setLoading(true);
    setReport("");
    try {
      const summary = `Wallet ${address}
Range: last ${range === "week" ? "7 days" : "30 days"}
Total sent: ${total.toFixed(4)} USDC
Transactions: ${rows.length}
By category: ${Object.entries(byCat).map(([k, v]) => `${k} ${v.toFixed(4)}`).join(", ")}
Recent memos: ${rows.slice(0, 10).map((r) => r.memo).filter(Boolean).join(" | ") || "(none)"}`;
      const prompt = `You are ArcPilot AI. Produce a concise ${
        range === "week" ? "weekly" : "monthly"
      } finance report for this Arc Testnet wallet. Use Markdown with short sections: Summary, Spending breakdown, Notable moves, Recommendations. Testnet USDC has no real value — mention this once. Data:\n${summary}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail ? `Report failed (${res.status}): ${detail}` : `Report failed (${res.status})`);
      }
      if (!res.body) throw new Error("Report failed: empty response");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReport(acc);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
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
    <div className="mx-auto max-w-4xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated weekly & monthly summaries with spending analysis and recommendations.
        </p>
      </motion.div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="glass inline-flex gap-1 rounded-full p-1">
          {(["week", "month"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs capitalize",
                range === r ? "bg-[image:var(--gradient-brand)] text-primary-foreground" : "hover:bg-accent/60",
              )}
            >
              <CalendarDays className="mr-1 inline h-3 w-3" /> Last {r === "week" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
        <Button onClick={generateReport} disabled={loading || paying} className="rounded-full shadow-glow">
          {loading || paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate AI report · {ACTION_FEE_USDC} USDC
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total sent" value={`${total.toFixed(4)} USDC`} highlight />
        <Stat label="Transactions" value={String(rows.length)} />
        <Stat
          label="Nanopayment spend"
          value={`${(byCat["nanopayment"] ?? 0).toFixed(4)} USDC`}
        />
        <Stat label="Top category" value={Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"} />
      </div>

      <div className="glass mt-6 min-h-[16rem] rounded-2xl p-6">
        {report ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click <b>Generate AI report</b> to get a full breakdown of your activity, budget adherence,
            and recommendations from ArcPilot.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl p-5", highlight && "bg-[image:var(--gradient-brand)]/10 shadow-glow")}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
