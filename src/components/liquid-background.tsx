import { useEffect, useState } from "react";

/**
 * Premium animated liquid-flow background — heavily optimized.
 * - Pure CSS keyframe animation (compositor-only)
 * - No fullscreen blur filter, no cursor rAF loop
 * - Pauses when tab is hidden, respects reduced-motion
 */
export function LiquidBackground() {
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
    <div aria-hidden="true" className="liquid-bg">
      <div className="liquid-base" />
      <div className="liquid-goo-layer">
        <div className="liquid-blob liquid-blob-1" style={{ animationPlayState: playState }} />
        <div className="liquid-blob liquid-blob-3" style={{ animationPlayState: playState }} />
      </div>
    </div>
  );
}
