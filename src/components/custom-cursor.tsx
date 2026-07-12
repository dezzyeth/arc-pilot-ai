import { useEffect, useRef, useState } from "react";

/**
 * Custom white cursor — a ring with a centered dot.
 * - Desktop only (skipped on touch / reduced-motion)
 * - Hides when pointer leaves the window
 * - Smoothly damped to actual pointer position
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  // Detect environments where a custom cursor should not be used.
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: none)");
    const update = () => setDisabled(motion.matches || hover.matches);
    update();
    motion.addEventListener?.("change", update);
    hover.addEventListener?.("change", update);
    return () => {
      motion.removeEventListener?.("change", update);
      hover.removeEventListener?.("change", update);
    };
  }, []);

  // Track pointer and animate the cursor ring/dot.
  useEffect(() => {
    if (disabled) return;

    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.body.addEventListener("mouseleave", onLeave);
    document.body.addEventListener("mouseenter", onEnter);

    let raf = 0;
    const tick = () => {
      const ease = 0.18;
      current.current.x += (target.current.x - current.current.x) * ease;
      current.current.y += (target.current.y - current.current.y) * ease;

      const el = cursorRef.current;
      if (el) {
        el.style.transform = `translate3d(${current.current.x.toFixed(1)}px, ${current.current.y.toFixed(1)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.cursor = originalCursor;
      window.removeEventListener("mousemove", onMove);
      document.body.removeEventListener("mouseleave", onLeave);
      document.body.removeEventListener("mouseenter", onEnter);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      data-visible={visible}
      aria-hidden="true"
    >
      <span className="custom-cursor-ring" />
      <span className="custom-cursor-dot" />
    </div>
  );
}
