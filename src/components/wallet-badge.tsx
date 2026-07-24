import { Bot, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Persistent visual distinction between the user's main MetaMask
 * wallet and the Nanopayments Agent Wallet. Used everywhere balances
 * or addresses are shown so the two never get confused.
 */
export function WalletBadge({
  kind,
  address,
  className,
}: {
  kind: "main" | "agent";
  address?: string | null;
  className?: string;
}) {
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  if (kind === "main") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300",
          className,
        )}
        title="Your MetaMask wallet"
      >
        <Wallet className="h-3 w-3" />
        <span>Main · {short || "not connected"}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-medium text-purple-200",
        className,
      )}
      title="Autonomous Nanopayments Agent Wallet"
    >
      <Bot className="h-3 w-3" />
      <span>Agent · {short || "not enabled"}</span>
    </span>
  );
}
