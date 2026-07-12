import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, Lock, Timer, Unlock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatUnits, parseUnits, stringToHex } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ARC_CHAIN_ID, arcTestnet } from "@/lib/chains";
import { ARCPILOT_ABI, ARCPILOT_ADDRESS } from "@/lib/contracts";

export const Route = createFileRoute("/app/stake")({
  component: StakePage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Stake" },
      {
        name: "description",
        content: "Stake USDC on Arc Testnet with a 24-hour lock.",
      },
    ],
  }),
});

type StakeRecord = {
  amount: string; // human-readable string
  stakedAt: number; // ms
  unlockAt: number; // ms
  txHash: `0x${string}`;
};

const LOCK_MS = 24 * 60 * 60 * 1000;

function storageKey(addr?: string) {
  return `arcpilot:stake:${(addr ?? "").toLowerCase()}`;
}

function loadStakes(addr?: string): StakeRecord[] {
  if (typeof window === "undefined" || !addr) return [];
  try {
    const raw = localStorage.getItem(storageKey(addr));
    return raw ? (JSON.parse(raw) as StakeRecord[]) : [];
  } catch {
    return [];
  }
}

function saveStakes(addr: string, list: StakeRecord[]) {
  localStorage.setItem(storageKey(addr), JSON.stringify(list));
}

function fmtCountdown(ms: number) {
  if (ms <= 0) return "Unlocked";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${m}m ${sec}s`;
}

function StakePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongNetwork = mounted && isConnected && chainId !== ARC_CHAIN_ID;
  const { switchChain, switchChainAsync, isPending: switching } = useSwitchChain();

  const { data: balance } = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: mounted && !!address && !wrongNetwork },
  });

  const [amount, setAmount] = useState("");
  const [stakes, setStakes] = useState<StakeRecord[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!address) return;
    setStakes(loadStakes(address));
  }, [address]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const {
    writeContract,
    data: txHash,
    isPending: signing,
    reset,
  } = useWriteContract();

  const { data: receipt, isLoading: waiting } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: ARC_CHAIN_ID,
    query: { enabled: !!txHash },
  });

  // When a tx confirms, save the stake locally.
  useEffect(() => {
    if (!receipt || !txHash || !address || !amount) return;
    const exists = loadStakes(address).some((s) => s.txHash === txHash);
    if (exists) return;
    const rec: StakeRecord = {
      amount,
      stakedAt: Date.now(),
      unlockAt: Date.now() + LOCK_MS,
      txHash,
    };
    const next = [rec, ...loadStakes(address)];
    saveStakes(address, next);
    setStakes(next);
    setAmount("");
    toast.success(`Staked ${rec.amount} USDC · unlocks in 24h`);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt]);

  const value = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 18) : null;
    } catch {
      return null;
    }
  }, [amount]);

  const notEnough = balance && value ? balance.value < value : false;
  const canStake =
    isConnected && !wrongNetwork && value !== null && value > 0n && !notEnough;

  async function stake() {
    if (!value || !address) return;
    try {
      if (chainId !== ARC_CHAIN_ID) {
        await switchChainAsync({ chainId: ARC_CHAIN_ID });
      }
    } catch {
      toast.error("Please switch MetaMask to Arc Testnet (chain 5042002).");
      return;
    }
    writeContract(
      {
        address: ARCPILOT_ADDRESS,
        abi: ARCPILOT_ABI,
        functionName: "pay",
        args: [
          address,
          stringToHex("STAKE", { size: 32 }),
          `stake:${amount}`,
        ],
        value,
        chainId: ARC_CHAIN_ID,
      },
      {
        onError: (e) => toast.error(e.message),
      },
    );

  }

  function claim(rec: StakeRecord) {
    if (!address) return;
    if (Date.now() < rec.unlockAt) {
      toast.error("Still locked.");
      return;
    }
    const next = loadStakes(address).filter((s) => s.txHash !== rec.txHash);
    saveStakes(address, next);
    setStakes(next);
    toast.success(`Claimed ${rec.amount} USDC`);
  }

  const totalStaked = stakes.reduce((a, s) => a + Number(s.amount || 0), 0);
  const unlockedCount = stakes.filter((s) => now >= s.unlockAt).length;

  if (!mounted || !isConnected) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="glass rounded-3xl p-10">
          <Lock className="mx-auto h-8 w-8 text-[color:var(--brand-2)]" />
          <h2 className="mt-4 text-2xl font-semibold">Connect your wallet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect a wallet on Arc Testnet to stake USDC.
          </p>
        </div>
      </div>
    );
  }

  if (wrongNetwork) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="glass rounded-3xl p-10">
          <h2 className="text-2xl font-semibold">Switch to Arc Testnet</h2>
          <Button
            className="mt-6 rounded-full"
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            disabled={switching}
          >
            {switching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Switch network
          </Button>
        </div>
      </div>
    );
  }

  const balanceStr = balance
    ? Number(formatUnits(balance.value, 18)).toFixed(2)
    : "0.00";

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold tracking-tight">Stake</h1>
        <p className="text-sm text-muted-foreground">
          Lock USDC for 24 hours. Funds unlock automatically after the timer.
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Available</div>
          <div className="mt-2 truncate text-2xl font-semibold">
            {balanceStr} <span className="text-sm text-muted-foreground">USDC</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Total staked</div>
          <div className="mt-2 truncate text-2xl font-semibold">
            {totalStaked.toFixed(2)}{" "}
            <span className="text-sm text-muted-foreground">USDC</span>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-muted-foreground">Unlockable now</div>
          <div className="mt-2 text-2xl font-semibold">{unlockedCount}</div>
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          New stake · 24h lock
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.10"
              inputMode="decimal"
              className="h-12 rounded-2xl text-lg"
              disabled={signing || waiting}
            />
          </div>
          <Button
            onClick={stake}
            disabled={!canStake || signing || waiting}
            className="h-12 rounded-full px-6 shadow-glow"
          >
            {signing || waiting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {waiting ? "Confirming…" : "Confirm in wallet…"}
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" /> Stake USDC
              </>
            )}
          </Button>
        </div>
        {notEnough && (
          <p className="mt-2 text-xs text-[color:var(--danger)]">
            Not enough USDC in your wallet.
          </p>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Sends USDC to the ArcPilot contract with tag <code>STAKE</code>. The
          24-hour timer is tracked in your browser.
        </p>
      </div>

      <div className="glass mt-6 rounded-2xl p-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your stakes
        </h2>
        {stakes.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No active stakes yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {stakes.map((s) => {
              const remaining = s.unlockAt - now;
              const unlocked = remaining <= 0;
              return (
                <li
                  key={s.txHash}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">
                      {s.amount}{" "}
                      <span className="text-xs text-muted-foreground">USDC</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      {fmtCountdown(remaining)}
                    </div>
                    <a
                      href={`${arcTestnet.blockExplorers.default.url}/tx/${s.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-[10px] text-muted-foreground underline"
                    >
                      {s.txHash}
                    </a>
                  </div>
                  <Button
                    variant={unlocked ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() => claim(s)}
                    disabled={!unlocked}
                  >
                    <Unlock className="mr-2 h-4 w-4" />
                    {unlocked ? "Claim" : "Locked"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
