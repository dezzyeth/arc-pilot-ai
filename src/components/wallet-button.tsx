import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { Button } from "@/components/ui/button";
import { ARC_CHAIN_ID } from "@/lib/chains";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending: connecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(address) && chainId === ARC_CHAIN_ID },
  });

  useEffect(() => {
    if (connectError) toast.error(connectError.message);
  }, [connectError]);

  if (!mounted) {
    return (
      <Button variant="secondary" disabled className="rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const metaMask = connectors.find((c) => c.id === "injected") ?? connectors[0];
  const hasMetaMask =
    typeof window !== "undefined" &&
    Boolean((window as unknown as { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask);

  if (!isConnected) {
    return (
      <Button
        onClick={() => {
          if (!hasMetaMask) {
            toast.error("MetaMask not detected", {
              description: "Install MetaMask to connect your wallet.",
              action: {
                label: "Install",
                onClick: () => window.open("https://metamask.io/download/", "_blank"),
              },
            });
            return;
          }
          if (metaMask) connect({ connector: metaMask, chainId: ARC_CHAIN_ID });
        }}
        disabled={connecting}
        className="rounded-full shadow-glow"
      >
        {connecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting…
          </>
        ) : (
          "Connect MetaMask"
        )}
      </Button>
    );
  }

  if (chainId !== ARC_CHAIN_ID) {
    return (
      <Button
        variant="destructive"
        onClick={() =>
          switchChain(
            { chainId: ARC_CHAIN_ID },
            {
              onError: (err) =>
                toast.error("Failed to switch network", { description: err.message }),
            },
          )
        }
        disabled={switching}
        className="rounded-full"
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        {switching ? "Switching…" : "Switch to Arc Testnet"}
      </Button>
    );
  }

  const displayBalance = balance
    ? `${Number(formatEther(balance.value)).toFixed(4)} ${balance.symbol}`
    : null;

  return (
    <div className="flex items-center gap-2">
      <span className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
        Arc Testnet
      </span>
      <button
        onClick={() => disconnect()}
        title="Disconnect"
        className="glass rounded-full px-4 py-1.5 text-sm font-medium hover:bg-accent"
      >
        {address ? short(address) : ""}
        {displayBalance ? (
          <span className="ml-2 text-muted-foreground">{displayBalance}</span>
        ) : null}
      </button>
    </div>
  );
}
