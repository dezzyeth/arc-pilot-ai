import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Droplets,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAccount, useSignMessage } from "wagmi";

import { Button } from "@/components/ui/button";

type ProvisionResp = {
  circle_wallet_id: string;
  circle_wallet_address: string;
  blockchain: string;
  existed?: boolean;
  error?: string;
};

type BalanceResp = {
  circle_wallet_id: string;
  circle_wallet_address: string;
  blockchain: string;
  tokenBalances: Array<{
    token?: { symbol?: string; name?: string; decimals?: number };
    amount?: string;
  }>;
  error?: string;
};

function short(a?: string) {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export function CircleWalletCard() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const qc = useQueryClient();

  const evm = address?.toLowerCase();

  // Look up whether a Circle wallet already exists for this EVM address.
  const lookup = useQuery({
    queryKey: ["circle-wallet", evm],
    enabled: Boolean(evm),
    queryFn: async () => {
      const res = await fetch(
        `/api/circle/balance?evm_address=${encodeURIComponent(evm!)}`,
      );
      if (res.status === 404) return null;
      const data = (await res.json()) as BalanceResp;
      if (!res.ok) throw new Error(data.error ?? "Failed to load balance");
      return data;
    },
    staleTime: 30_000,
    retry: false,
  });

  const provision = useMutation({
    mutationFn: async () => {
      if (!evm) throw new Error("Connect wallet first");
      const nonce = crypto.randomUUID();
      const message = `Sign to link this wallet with ArcPilot Circle Wallet.\nAddress: ${evm}\nNonce: ${nonce}`;
      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/circle/provision", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          evm_address: evm,
          message,
          nonce,
          signature,
        }),
      });
      const data = (await res.json()) as ProvisionResp;
      if (!res.ok) throw new Error(data.error ?? "Provisioning failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.existed ? "Circle wallet linked" : "Circle wallet created",
        { description: short(data.circle_wallet_address) },
      );
      qc.invalidateQueries({ queryKey: ["circle-wallet", evm] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const circleAddress = lookup.data?.circle_wallet_address;
  const usdc = useMemo(() => {
    const b = lookup.data?.tokenBalances?.find(
      (t) => t.token?.symbol?.toUpperCase() === "USDC",
    );
    if (!b?.amount) return null;
    return b.amount;
  }, [lookup.data]);

  if (!isConnected) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6]">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Circle Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Programmable wallet auto-provisioned for your EVM address
            </p>
          </div>
        </div>
        {circleAddress ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Linked
          </span>
        ) : null}
      </div>

      {lookup.isLoading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking Circle wallet…
        </div>
      ) : !circleAddress ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign a one-time message to create your unique Circle wallet. Your
            keys are managed securely by Circle — no seed phrase needed.
          </p>
          <Button
            onClick={() => provision.mutate()}
            disabled={provision.isPending}
            className="rounded-full shadow-glow"
          >
            {provision.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing & provisioning…
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Create my Circle wallet
              </>
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                EVM address
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-sm">
                {short(evm)}
                <CopyBtn value={evm ?? ""} />
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Circle wallet · Arc Testnet
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-sm">
                {short(circleAddress)}
                <CopyBtn value={circleAddress} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Balance:{" "}
                <span className="font-medium text-foreground">
                  {usdc ? `${usdc} USDC` : "0.00 USDC"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-gradient-to-br from-[#4F46E5]/5 to-[#8B5CF6]/5 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#4F46E5]/20 text-[#A5B4FC]">
                <Droplets className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Need testnet funds?</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Copy your Circle wallet address and request USDC from Circle's
                  official faucet.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => {
                      navigator.clipboard.writeText(circleAddress);
                      toast.success("Circle wallet address copied");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy address
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="rounded-full bg-gradient-to-r from-[#4F46E5] to-[#8B5CF6]"
                  >
                    <a
                      href="https://faucet.circle.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Droplets className="mr-1.5 h-3.5 w-3.5" />
                      Open Circle faucet
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() =>
                      qc.invalidateQueries({
                        queryKey: ["circle-wallet", evm],
                      })
                    }
                  >
                    Refresh balance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function CopyBtn({ value }: { value: string }) {
  return (
    <button
      onClick={() => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        toast.success("Copied");
      }}
      className="text-muted-foreground hover:text-foreground"
      aria-label="Copy"
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}
