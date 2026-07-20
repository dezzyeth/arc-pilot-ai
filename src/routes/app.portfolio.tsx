import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { PieChart as PieIcon, TrendingUp, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";

import { ExplorerLink } from "@/components/explorer-link";
import { supabase } from "@/integrations/supabase/client";
import { ARC_CHAIN_ID } from "@/lib/chains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Portfolio" },
      { name: "description", content: "Portfolio & holdings overview on Arc Testnet." },
    ],
  }),
});

type TxRow = {
  id: string;
  hash: string | null;
  to_addr: string | null;
  amount_usdc: number;
  category: string | null;
  memo: string | null;
  explanation: string | null;
  created_at: string;
  direction: string;
};

function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = mounted && isConnected && chainId !== ARC_CHAIN_ID;
  const { data: balance } = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: mounted && !!address && !wrongNetwork },
  });

  const [rows, setRows] = useState<TxRow[]>([]);
  useEffect(() => {
    if (!address) return;
    supabase
      .from("tx_log")
      .select("*")
      .eq("wallet", address.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data as TxRow[]) ?? []));
  }, [address]);

  const balUsdc = balance ? Number(formatUnits(balance.value, 18)) : 0;
  const spent = rows
    .filter((r) => r.direction === "out")
    .reduce((s, r) => s + Number(r.amount_usdc), 0);

  const byCat = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.category || "transfer";
    acc[k] = (acc[k] || 0) + Number(r.amount_usdc);
    return acc;
  }, {});
  const catTotal = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;

  if (!mounted || !isConnected) {
    return (
      <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center">
        <Wallet className="mx-auto h-8 w-8 text-[color:var(--brand-2)]" />
        <h2 className="mt-4 text-2xl font-semibold">Connect your wallet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect on Arc Testnet to see your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          Live holdings, allocation and lifetime activity on Arc Testnet.
        </p>
      </motion.div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total holdings" value={`${balUsdc.toFixed(4)} USDC`} icon={Wallet} highlight />
        <StatCard label="Lifetime sent" value={`${spent.toFixed(4)} USDC`} icon={TrendingUp} />
        <StatCard label="Transactions" value={String(rows.length)} icon={PieIcon} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">Recent transactions</h2>
          {rows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No transactions logged yet. Sends from the chat page will appear here.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {rows.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {r.category || "transfer"} · {r.to_addr ? `${r.to_addr.slice(0, 6)}…${r.to_addr.slice(-4)}` : "—"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} {r.memo ? `· ${r.memo}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{Number(r.amount_usdc).toFixed(4)} USDC</span>
                    {r.hash && (
                      <a
                        href={`${arcTestnet.blockExplorers.default.url}/tx/${r.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm font-medium text-muted-foreground">Allocation by category</h2>
          {Object.keys(byCat).length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">No categorized spend yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {Object.entries(byCat).map(([k, v]) => {
                const pct = (v / catTotal) * 100;
                return (
                  <li key={k}>
                    <div className="flex justify-between text-xs">
                      <span className="capitalize">{k}</span>
                      <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-accent/40">
                      <div
                        className="h-full rounded-full bg-[image:var(--gradient-brand)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
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

function StatCard({
  label, value, icon: Icon, highlight,
}: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; highlight?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl p-5", highlight && "bg-[image:var(--gradient-brand)]/10 shadow-glow")}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
