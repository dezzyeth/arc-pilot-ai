import { useEffect, useRef, useState } from "react";

/**
 * Ultra-premium ambient background.
 * - Deep midnight base with a slowly drifting radial
 * - Aurora silk gradients morphing under heavy blur
 * - Cinematic bloom lights at very low opacity
 * - Subtle SVG grain
 * - Elegant, damped mouse parallax (max ~24px)
 * Pauses when tab hidden; respects reduced-motion.
 */
export function LiquidBackground() {
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  // Elegant damped pointer parallax — no rAF churn when idle
  useEffect(() => {
    if (reduced) return;
    const hover = window.matchMedia("(hover: none)");
    if (hover.matches) return;

    const el = rootRef.current;
    if (!el) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;
    let raf = 0;
    let running = false;

    const tick = () => {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      el.style.setProperty("--px", `${cx.toFixed(2)}px`);
      el.style.setProperty("--py", `${cy.toFixed(2)}px`);
      if (Math.abs(tx - cx) < 0.1 && Math.abs(ty - cy) < 0.1) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      tx = nx * 18;
      ty = ny * 18;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };


    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const playState = reduced || hidden ? "paused" : "running";

  return (
    <div ref={rootRef} aria-hidden="true" className="lm-bg">
      <div className="lm-base" style={{ animationPlayState: playState }} />
      <div className="lm-aurora">
        <div className="lm-silk lm-silk-1" style={{ animationPlayState: playState }} />
        <div className="lm-silk lm-silk-2" style={{ animationPlayState: playState }} />
        <div className="lm-silk lm-silk-3" style={{ animationPlayState: playState }} />
      </div>
      <div className="lm-blooms">
        <div className="lm-bloom lm-bloom-tl" style={{ animationPlayState: playState }} />
        <div className="lm-bloom lm-bloom-bc" style={{ animationPlayState: playState }} />
        <div className="lm-bloom lm-bloom-fr" style={{ animationPlayState: playState }} />
      </div>
      <div className="lm-reflect" style={{ animationPlayState: playState }} />

      <div className="lm-mesh" style={{ animationPlayState: playState }} />
      <div className="lm-grain" style={{ animationPlayState: playState }} />
      <div className="lm-vignette" />
    </div>
  );
}
