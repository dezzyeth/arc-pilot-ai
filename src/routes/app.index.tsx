import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";

import { Button } from "@/components/ui/button";
import { ARC_CHAIN_ID, arcTestnet } from "@/lib/chains";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function shortAddr(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

function Dashboard() {
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

  const balanceStr = balance ? Number(formatUnits(balance.value, 6)).toFixed(4) : "0.0000";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {!mounted || !isConnected ? (
        <ConnectPrompt />
      ) : wrongNetwork ? (
        <WrongNetwork />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Here's a snapshot of your Arc Testnet activity.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Wallet balance"
              value={`${balanceStr} USDC`}
              icon={Wallet}
              highlight
            />
            <StatCard label="Network" value="Arc Testnet" icon={ShieldCheck} />
            <StatCard label="24h P/L" value="+0.00%" icon={TrendingUp} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 lg:col-span-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">Wallet</h2>
                <a
                  href={`${arcTestnet.blockExplorers.default.url}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Explorer <ExternalLink className="ml-1 inline h-3 w-3" />
                </a>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="rounded-xl bg-[image:var(--gradient-brand)] px-3 py-2 font-mono text-sm text-primary-foreground">
                  {shortAddr(address)}
                </div>
                <button
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                      toast.success("Address copied");
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 text-4xl font-semibold tracking-tight">
                {balanceStr} <span className="text-lg text-muted-foreground">ARC</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="rounded-full shadow-glow">
                  <Link to="/app/chat">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ask ArcPilot
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-full">
                  <Link to="/app/chat" search={{}}>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Send ARC
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-sm font-medium text-muted-foreground">AI insights</h2>
              <ul className="mt-4 space-y-3 text-sm">
                <Insight>
                  You're only connected to Arc Testnet — great, ArcPilot only signs here.
                </Insight>
                <Insight>Try: “send 0.1 ARC to 0x… and warn me if it's new”.</Insight>
                <Insight>Every transaction is simulated before you sign.</Insight>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass mt-6 rounded-2xl p-6"
          >
            <h2 className="text-sm font-medium text-muted-foreground">Recent activity</h2>
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No transactions yet. Head to{" "}
              <Link to="/app/chat" className="underline hover:text-foreground">
                AI Chat
              </Link>{" "}
              to send your first ARC.
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-2xl p-5",
        highlight && "bg-[image:var(--gradient-brand)]/10 shadow-glow",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </motion.div>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--brand-2)]" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function ConnectPrompt() {
  return (
    <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center shadow-glow">
      <Wallet className="mx-auto h-8 w-8 text-[color:var(--brand-2)]" />
      <h2 className="mt-4 text-2xl font-semibold">Connect your wallet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        ArcPilot needs a wallet on Arc Testnet before it can help you.
      </p>
      <p className="mt-6 text-xs text-muted-foreground">
        Use the Connect wallet button in the top-right.
      </p>
    </div>
  );
}

function WrongNetwork() {
  return (
    <div className="glass mx-auto mt-16 max-w-lg rounded-3xl p-10 text-center">
      <ShieldCheck className="mx-auto h-8 w-8 text-[color:var(--warning)]" />
      <h2 className="mt-4 text-2xl font-semibold">Switch to Arc Testnet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        ArcPilot only operates on Arc Testnet. Use the network switcher in the top-right
        of the page.
      </p>
    </div>
  );
}
