import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ARC_KNOWLEDGE } from "@/lib/arc-knowledge";

export const Route = createFileRoute("/app/docs")({
  component: DocsPage,
  head: () => ({
    meta: [
      { title: "ArcPilot · Arc Docs" },
      {
        name: "description",
        content:
          "Everything you need to know about Arc — Circle's programmable money Layer-1 — right inside ArcPilot.",
      },
    ],
  }),
});

const QUICK_LINKS: { label: string; href: string }[] = [
  { label: "Arc overview", href: "https://docs.arc.io/arc-chain" },
  {
    label: "Connect to Arc",
    href: "https://docs.arc.io/arc/references/connect-to-arc",
  },
  {
    label: "Contract addresses",
    href: "https://docs.arc.io/arc/references/contract-addresses",
  },
  {
    label: "EVM differences",
    href: "https://docs.arc.io/arc/references/evm-differences",
  },
  {
    label: "Gas & fees",
    href: "https://docs.arc.io/arc/references/gas-and-fees",
  },
  { label: "App Kit", href: "https://docs.arc.io/app-kit" },
  {
    label: "Unified Balance",
    href: "https://docs.arc.io/app-kit/unified-balance",
  },
  {
    label: "Agentic economy",
    href: "https://docs.arc.io/build/agentic-economy",
  },
  { label: "Faucet", href: "https://faucet.circle.com" },
  { label: "Explorer", href: "https://testnet.arcscan.app" },
];

function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Knowledge base
        </div>
        <h1 className="mt-1 text-3xl font-semibold">Arc documentation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Everything ArcPilot knows about Arc — Circle's Layer-1 for
          programmable money. Ask the AI Chat anything from these topics.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {QUICK_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="glass flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs transition-colors hover:text-foreground"
          >
            <span className="truncate">{l.label}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          </a>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="prose prose-invert prose-sm max-w-none prose-headings:mt-6 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-lg prose-a:text-[color:var(--brand-2)] prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {ARC_KNOWLEDGE}
          </ReactMarkdown>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Sourced from{" "}
        <a
          href="https://docs.arc.io"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          docs.arc.io
        </a>
        . Testnet only — no real value.
      </p>
    </div>
  );
}
