import { useEffect, useState } from "react";

/**
 * Cinematic intro: "ARC" zooms from tiny to huge with a shimmer,
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
    const t1 = setTimeout(() => setPhase("out"), 1900);
    const t2 = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem("arcpilot_intro_played", "1");
    }, 2600);
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
        <div className="intro-word">
          {"ARC".split("").map((ch, i) => (
            <span key={i} className="intro-letter" style={{ ["--i" as string]: i }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="intro-sub">PILOT · AI</div>
        <div className="intro-ring" />
        <div className="intro-ring intro-ring--2" />
      </div>
    </div>
  );
}
