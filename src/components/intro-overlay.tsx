import { useEffect, useState } from "react";
import arcLogo from "@/assets/arc-logo.jpeg.asset.json";

/**
 * Cinematic intro: Arc logo zooms from a tiny speck into a huge hero mark
 * with shimmer + rings + wordmark, then fades to reveal the app.
 * Plays on every full page load (not on SPA route changes).
 */
export function IntroOverlay() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    setMounted(true);
    const t1 = setTimeout(() => setPhase("out"), 3200);
    const t2 = setTimeout(() => setPhase("done"), 4100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!mounted || phase === "done") return null;

  return (
    <div
      className={`intro-overlay ${phase === "out" ? "intro-overlay--out" : ""}`}
      aria-hidden="true"
    >
      <div className="intro-vignette" />
      <div className="intro-stars" />
      <div className="intro-stage">
        <div className="intro-logo-wrap">
          <div className="intro-ring" />
          <div className="intro-ring intro-ring--2" />
          <div className="intro-ring intro-ring--3" />
          <div className="intro-logo">
            <img src={arcLogo.url} alt="Arc" className="intro-logo-img" draggable={false} />
            <div className="intro-logo-shine" />
            <div className="intro-logo-glow" />
          </div>
        </div>
        <div className="intro-wordmark">ARCPILOT</div>
        <div className="intro-sub">AI · FINANCE COPILOT</div>
      </div>
    </div>
  );
}
