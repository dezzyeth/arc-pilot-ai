import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ARC_CHAIN_ID } from "@/lib/chains";

export function WalletButton() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <Button variant="secondary" disabled className="rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted: rkMounted }) => {
        const ready = rkMounted;
        const connected = ready && account && chain;

        if (!ready) {
          return (
            <Button variant="secondary" disabled className="rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          );
        }
        if (!connected) {
          return (
            <Button onClick={openConnectModal} className="rounded-full shadow-glow">
              Connect wallet
            </Button>
          );
        }
        if (chain.id !== ARC_CHAIN_ID) {
          return (
            <Button variant="destructive" onClick={openChainModal} className="rounded-full">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Switch to Arc Testnet
            </Button>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              className="glass rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--success)]" />
              Arc Testnet
            </button>
            <button
              onClick={openAccountModal}
              className="glass rounded-full px-4 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {account.displayName}
              {account.displayBalance ? (
                <span className="ml-2 text-muted-foreground">{account.displayBalance}</span>
              ) : null}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
