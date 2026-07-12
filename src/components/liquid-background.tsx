import { useEffect, useRef, useState } from "react";

/**
 * Premium animated liquid-flow background.
 * - Fixed, full-screen, behind all content (z-index: -1, pointer-events: none)
 * - Uses GPU-accelerated transforms
 * - Pauses when tab is hidden
 * - Respects prefers-reduced-motion
 */
export function LiquidBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(m.matches);
    update();
    m.addEventListener?.("change", update);
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      m.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const playState = reduced || hidden ? "paused" : "running";

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="liquid-bg"
      style={{ animationPlayState: playState } as React.CSSProperties}
    >
      <div className="liquid-base" />
      <div className="liquid-blob liquid-blob-1" style={{ animationPlayState: playState }} />
      <div className="liquid-blob liquid-blob-2" style={{ animationPlayState: playState }} />
      <div className="liquid-blob liquid-blob-3" style={{ animationPlayState: playState }} />
      <div className="liquid-blob liquid-blob-4" style={{ animationPlayState: playState }} />
      <div className="liquid-blob liquid-blob-5" style={{ animationPlayState: playState }} />
      <div className="liquid-blob liquid-blob-6" style={{ animationPlayState: playState }} />
      <div className="liquid-grain" />
    </div>
  );
}
