import { useEffect, useState } from "react";
import arcLogo from "@/assets/arc-logo.jpeg.asset.json";

/**
 * Cinematic intro: Arc logo zooms from tiny to huge with shimmer + rings,
 * then fades to reveal the app. Runs once per session.
 */
export function IntroOverlay() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("arcpilot_intro_played")) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      sessionStorage.setItem("arcpilot_intro_played", "1");
      return;
    }
    setShow(true);
    const t1 = setTimeout(() => setPhase("out"), 2100);
    const t2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("arcpilot_intro_played", "1");
    }, 2900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`intro-overlay ${phase === "out" ? "intro-overlay--out" : ""}`}
      aria-hidden="true"
    >
      <div className="intro-vignette" />
      <div className="intro-stage">
        <div className="intro-logo-wrap">
          <div className="intro-ring" />
          <div className="intro-ring intro-ring--2" />
          <div className="intro-logo">
            <img src={arcLogo.url} alt="Arc" className="intro-logo-img" draggable={false} />
            <div className="intro-logo-shine" />
          </div>
        </div>
        <div className="intro-sub">ARCPILOT · AI</div>
      </div>
    </div>
  );
}
