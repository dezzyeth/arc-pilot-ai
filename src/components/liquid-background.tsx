import { useEffect, useRef, useState } from "react";

/**
 * Premium animated liquid-flow background with interactive mouse physics.
 * - Fixed, full-screen, behind all content (z-index: -1, pointer-events: none)
 * - Uses GPU-accelerated transforms
 * - Pauses when tab is hidden
 * - Respects prefers-reduced-motion
 * - Cursor gently "pushes through" the liquid with smooth damping/inertia
 */
export function LiquidBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const wrapRefs = useRef<Array<HTMLDivElement | null>>([]);
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

  // Interactive mouse physics (skipped for reduced-motion / touch-only devices)
  useEffect(() => {
    if (reduced) return;
    const isTouchOnly =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches;
    if (isTouchOnly) return;

    // Target position (raw pointer) and smoothed position (damped follower)
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let sx = tx;
    let sy = ty;
    // Velocity for subtle inertia
    let vx = 0;
    let vy = 0;
    // Active intensity (0..1) — fades out after cursor stops moving
    let intensity = 0;
    let targetIntensity = 0;
    let lastMove = performance.now();

    // Per-blob attraction factors (how strongly each blob drifts toward cursor).
    // Small values keep the effect subtle & elegant.
    const factors = [0.06, -0.05, 0.045, -0.055, 0.05, -0.04];

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

    let raf = 0;
    const tick = () => {
      // Fade intensity when cursor is idle > 600ms
      if (performance.now() - lastMove > 600) targetIntensity = 0;

      // Smooth damping toward pointer (viscous liquid feel)
      const ease = 0.08;
      const nx = sx + (tx - sx) * ease;
      const ny = sy + (ty - sy) * ease;
      vx = nx - sx;
      vy = ny - sy;
      sx = nx;
      sy = ny;

      // Elastic intensity relaxation
      intensity += (targetIntensity - intensity) * 0.05;

      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = sx - cx;
      const dy = sy - cy;

      // Apply per-blob offsets via CSS variables — layered on top of keyframe drift
      for (let i = 0; i < wrapRefs.current.length; i++) {
        const el = wrapRefs.current[i];
        if (!el) continue;
        const f = factors[i] ?? 0;
        // Add a touch of velocity for momentum
        const ox = dx * f + vx * f * 6;
        const oy = dy * f + vy * f * 6;
        el.style.setProperty("--mx", `${ox.toFixed(2)}px`);
        el.style.setProperty("--my", `${oy.toFixed(2)}px`);
      }

      // Cursor glow follows smoothed position
      const glow = glowRef.current;
      if (glow) {
        glow.style.setProperty("--cx", `${sx.toFixed(2)}px`);
        glow.style.setProperty("--cy", `${sy.toFixed(2)}px`);
        glow.style.opacity = String(intensity * 0.9);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, [reduced]);

  const playState = reduced || hidden ? "paused" : "running";

  const blobClasses = [
    "liquid-blob-1",
    "liquid-blob-2",
    "liquid-blob-3",
    "liquid-blob-4",
    "liquid-blob-5",
    "liquid-blob-6",
  ];

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="liquid-bg"
      style={{ animationPlayState: playState } as React.CSSProperties}
    >
      {/* SVG goo filter for merging liquid metaball effect */}
      <svg className="liquid-svg" aria-hidden="true">
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className="liquid-base" />
      <div className="liquid-sheen" />
      <div className="liquid-goo-layer">
        {blobClasses.map((cls, i) => (
          <div
            key={cls}
            ref={(el) => {
              wrapRefs.current[i] = el;
            }}
            className="liquid-blob-wrap"
          >
            <div
              className={`liquid-blob ${cls}`}
              style={{ animationPlayState: playState }}
            />
          </div>
        ))}
      </div>
      <div ref={glowRef} className="liquid-cursor-glow" />
      <div className="liquid-grain" />
    </div>
  );
}

