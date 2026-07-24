import { useEffect, useState } from "react";
import { Coins, ExternalLink, Wallet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PAID_ROUTES, getSellerWallet } from "@/lib/x402-config";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  route: string;
  amount_usdc: number;
  payer_addr: string | null;
  tx_ref: string | null;
  created_at: string;
};

export function EarningsCard({ className }: { className?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [seller, setSeller] = useState<string>("");

  useEffect(() => {
    setSeller(getSellerWallet());
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("payment_events")
        .select("id, route, amount_usdc, payer_addr, tx_ref, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled) setRows((data as Row[]) ?? []);
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.amount_usdc ?? 0), 0);
  const byRoute = rows.reduce<Record<string, { count: number; total: number }>>(
    (acc, r) => {
      acc[r.route] ??= { count: 0, total: 0 };
      acc[r.route].count += 1;
      acc[r.route].total += Number(r.amount_usdc ?? 0);
      return acc;
    },
    {},
  );

  const explorer = seller
    ? `https://testnet.arcscan.app/address/${seller}`
    : undefined;

  return (
    <div className={cn("glass rounded-2xl p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Coins className="h-3.5 w-3.5" /> x402 earnings
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {total.toFixed(4)} <span className="text-base text-muted-foreground">USDC</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Accumulated from paid API routes · last {rows.length} events
          </div>
        </div>
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-muted-foreground hover:bg-white/5"
          title="View seller wallet on explorer"
        >
          Withdraw via Gateway <ExternalLink className="ml-1 inline h-3 w-3" />
        </a>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {Object.keys(PAID_ROUTES).map((route) => {
          const stat = byRoute[route] ?? { count: 0, total: 0 };
          const cfg = PAID_ROUTES[route as keyof typeof PAID_ROUTES];
          return (
            <div
              key={route}
              className="rounded-xl border border-white/10 p-3 text-[11px]"
            >
              <div className="truncate font-mono text-foreground">{route}</div>
              <div className="mt-1 text-muted-foreground">
                {cfg.priceUsdc} USDC · {stat.count} calls
              </div>
              <div className="mt-0.5 tabular-nums text-[color:var(--brand-2)]">
                {stat.total.toFixed(4)} USDC
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-muted-foreground">
        <Wallet className="h-3 w-3" />
        <span>Seller wallet:</span>
        <code className="truncate">{seller || "not configured"}</code>
      </div>
    </div>
  );
}
