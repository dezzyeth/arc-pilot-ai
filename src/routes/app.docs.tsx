import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Languages, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ARC_KNOWLEDGE } from "@/lib/arc-knowledge";
import { translateArcDocs } from "@/lib/translate.functions";

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
  { label: "Connect to Arc", href: "https://docs.arc.io/arc/references/connect-to-arc" },
  { label: "Contract addresses", href: "https://docs.arc.io/arc/references/contract-addresses" },
  { label: "EVM differences", href: "https://docs.arc.io/arc/references/evm-differences" },
  { label: "Gas & fees", href: "https://docs.arc.io/arc/references/gas-and-fees" },
  { label: "App Kit", href: "https://docs.arc.io/app-kit" },
  { label: "Unified Balance", href: "https://docs.arc.io/app-kit/unified-balance" },
  { label: "Agentic economy", href: "https://docs.arc.io/build/agentic-economy" },
  { label: "Faucet", href: "https://faucet.circle.com" },
  { label: "Explorer", href: "https://testnet.arcscan.app" },
];

const LANGUAGES: { code: string; label: string; native: string }[] = [
  { code: "English", label: "English", native: "English" },
  { code: "Chinese (Simplified)", label: "Chinese", native: "中文" },
  { code: "Hindi", label: "Hindi", native: "हिन्दी" },
  { code: "Spanish", label: "Spanish", native: "Español" },
  { code: "Arabic", label: "Arabic", native: "العربية" },
  { code: "French", label: "French", native: "Français" },
  { code: "Portuguese", label: "Portuguese", native: "Português" },
  { code: "Russian", label: "Russian", native: "Русский" },
  { code: "Japanese", label: "Japanese", native: "日本語" },
  { code: "Korean", label: "Korean", native: "한국어" },
  { code: "German", label: "German", native: "Deutsch" },
  { code: "Italian", label: "Italian", native: "Italiano" },
  { code: "Dutch", label: "Dutch", native: "Nederlands" },
  { code: "Vietnamese", label: "Vietnamese", native: "Tiếng Việt" },
  { code: "Malay", label: "Malaysian", native: "Bahasa Melayu" },
  { code: "Indonesian", label: "Indonesian", native: "Bahasa Indonesia" },
  { code: "Thai", label: "Thai", native: "ไทย" },
  { code: "Turkish", label: "Turkish", native: "Türkçe" },
  { code: "Bengali", label: "Bengali", native: "বাংলা" },
  { code: "Tamil", label: "Tamil", native: "தமிழ்" },
  { code: "Urdu", label: "Urdu", native: "اردو" },
  { code: "Persian", label: "Persian", native: "فارسی" },
  { code: "Polish", label: "Polish", native: "Polski" },
  { code: "Ukrainian", label: "Ukrainian", native: "Українська" },
  { code: "Filipino", label: "Filipino", native: "Filipino" },
];

const RTL = new Set(["Arabic", "Urdu", "Persian"]);

function DocsPage() {
  const translate = useServerFn(translateArcDocs);
  const [lang, setLang] = useState("English");
  const [content, setContent] = useState(ARC_KNOWLEDGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<Record<string, string>>({ English: ARC_KNOWLEDGE });

  const isRTL = useMemo(() => RTL.has(lang), [lang]);

  useEffect(() => {
    let cancelled = false;
    if (cache.current[lang]) {
      setContent(cache.current[lang]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    translate({ data: { language: lang } })
      .then((res) => {
        if (cancelled) return;
        cache.current[lang] = res.markdown;
        setContent(res.markdown);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? "Translation failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, translate]);

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

      <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3">
        <Languages className="h-4 w-4 opacity-70" />
        <label htmlFor="lang" className="text-xs uppercase tracking-widest text-muted-foreground">
          Language
        </label>
        <select
          id="lang"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={loading}
          className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm outline-none transition-colors hover:border-white/20 focus:border-white/30 disabled:opacity-60"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native} · {l.label}
            </option>
          ))}
        </select>
        {loading && (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Translating…
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
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

      <div className="glass rounded-2xl p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="prose prose-invert prose-sm max-w-none prose-headings:mt-6 prose-headings:mb-2 prose-h1:text-2xl prose-h2:text-lg prose-a:text-[color:var(--brand-2)] prose-code:rounded prose-code:bg-black/30 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
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
        . Translations by AI — technical terms preserved. Testnet only — no real value.
      </p>
    </div>
  );
}
