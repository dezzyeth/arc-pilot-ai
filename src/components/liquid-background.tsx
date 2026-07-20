import { useEffect, useRef, useState } from "react";

/**
 * Premium animated liquid-flow background — optimized.
 * - Fixed, full-screen, behind all content
 * - Pure CSS keyframe animation (GPU compositor only)
 * - Lightweight cursor glow (throttled to ~30fps, single element)
 * - Pauses when tab is hidden, respects reduced-motion
 */
export function LiquidBackground() {
  const glowRef = useRef<HTMLDivElement>(null);
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

  // Lightweight cursor glow: only one element, throttled writes.
  useEffect(() => {
    if (reduced || hidden) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;

    const el = glowRef.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let intensity = 0;
    let targetIntensity = 0;
    let lastMove = performance.now();
    let raf = 0;
    let last = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      targetIntensity = 1;
      lastMove = performance.now();
    };
    const onLeave = () => {
      targetIntensity = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // ~30fps throttle
      if (now - last < 33) return;
      last = now;
      if (now - lastMove > 600) targetIntensity = 0;
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      intensity += (targetIntensity - intensity) * 0.06;
      el.style.transform = `translate3d(${(x - 280).toFixed(1)}px, ${(y - 280).toFixed(1)}px, 0)`;
      el.style.opacity = String(intensity * 0.85);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [reduced, hidden]);

  const playState = reduced || hidden ? "paused" : "running";

  return (
    <div aria-hidden="true" className="liquid-bg">
      <div className="liquid-base" />
      <div className="liquid-goo-layer">
        <div className="liquid-blob liquid-blob-1" style={{ animationPlayState: playState }} />
        <div className="liquid-blob liquid-blob-3" style={{ animationPlayState: playState }} />
        <div className="liquid-blob liquid-blob-5" style={{ animationPlayState: playState }} />
      </div>
      <div ref={glowRef} className="liquid-cursor-glow" />
    </div>
  );
}
