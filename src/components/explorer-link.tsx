import { ExternalLink } from "lucide-react";
import { arcTestnet } from "@/lib/chains";
import { cn } from "@/lib/utils";

type Kind = "tx" | "address" | "block";

export function explorerUrl(hashOrAddr: string, kind: Kind = "tx") {
  const base = arcTestnet.blockExplorers.default.url.replace(/\/$/, "");
  return `${base}/${kind}/${hashOrAddr}`;
}

/**
 * Consistent "View on explorer" button used everywhere we render an
 * on-chain hash/address. Two variants:
 *   - variant="button" (default) → pill button with label
 *   - variant="icon" → compact icon-only for dense rows
 */
export function ExplorerLink({
  value,
  kind = "tx",
  variant = "button",
  label = "View on explorer",
  className,
}: {
  value: string;
  kind?: Kind;
  variant?: "button" | "icon";
  label?: string;
  className?: string;
}) {
  const href = explorerUrl(value, kind);
  if (variant === "icon") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={label}
        aria-label={label}
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground",
          className,
        )}
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-white/20 hover:bg-white/10 hover:text-foreground",
        className,
      )}
    >
      <ExternalLink className="h-3 w-3" />
      {label}
    </a>
  );
}
