import { useEffect, useState, useRef } from "react";
import DialogSequence from "./DialogSequence";

// ── Timing (ms from start) ────────────────────────────────────────────────────
const T = {
  // Beat 1 - Blinking
  blinkOn1:     80,
  blinkOff1:   220,
  blinkOn2:    380,
  blinkOff2:   520,
  blinkOn3:    640,
  // Beat 2 - Car Doors
  carStart:    800,
  car1End:    1600,
  car2End:    2500,
  carEnd:     3500,
  // Beat 3 - Pan left
  panLeftEnd: 4800,
  // Beat 4 - Pan right
  panRightEnd:6100,
};

// objectPosition % — 0% = left edge, 100% = right edge
const POS = {
  landscape: { start: 78, left: 0, right: 100 },
  mobile:    { start: 60, left: 0, right: 100 },
};

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function useElapsed() {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      setElapsed(now - start);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  return elapsed;
}

function useIsMobile() {
  const mq = "(orientation: portrait), (max-width: 599px)";
  const [mob, setMob] = useState(() => window.matchMedia(mq).matches);
  useEffect(() => {
    const media = window.matchMedia(mq);
    const h = () => setMob(media.matches);
    media.addEventListener("change", h);
    return () => media.removeEventListener("change", h);
  }, []);
  return mob;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NeroIntro({ onComplete }) {
  const elapsed  = useElapsed();
  const isMobile = useIsMobile();
  const pos      = isMobile ? POS.mobile : POS.landscape;

  // Beat 1 – Blink
  const blinkPhase = elapsed < T.carStart;
  const blackOverlay = blinkPhase && (
    elapsed < T.blinkOn1 ||
    (elapsed >= T.blinkOff1 && elapsed < T.blinkOn2) ||
    (elapsed >= T.blinkOff2 && elapsed < T.blinkOn3)
  );

  // Beat 2 – Car frames
  const carPhase = elapsed < T.carEnd;
  const carFrame = elapsed < T.car1End ? 1 : elapsed < T.car2End ? 2 : 3;

  // Beats 3 & 4 – Pan
  let bgPct = pos.start;
  if (elapsed >= T.carEnd && elapsed < T.panLeftEnd) {
    const p = (elapsed - T.carEnd) / (T.panLeftEnd - T.carEnd);
    bgPct = pos.start + (pos.left - pos.start) * ease(p);
  } else if (elapsed >= T.panLeftEnd && elapsed < T.panRightEnd) {
    const p = (elapsed - T.panLeftEnd) / (T.panRightEnd - T.panLeftEnd);
    bgPct = pos.left + (pos.right - pos.left) * ease(p);
  } else if (elapsed >= T.panRightEnd) {
    bgPct = pos.right;
  }

  // Beat 5 – Vignette + dialog fade in
  const vignetteOpacity = elapsed >= T.panRightEnd
    ? Math.min(1, (elapsed - T.panRightEnd) / 500)
    : 0;

  const dialogOpacity = elapsed >= T.panRightEnd + 600
    ? Math.min(1, (elapsed - (T.panRightEnd + 600)) / 400)
    : 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden" }}>

      {/* BACKGROUND */}
      <img
        src="/images/background.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", zIndex: 0,
          left: 0, bottom: 0,
          width: "100%",
          height: isMobile ? "50%" : "100%",
          objectFit: "cover",
          objectPosition: `${bgPct}% center`,
        }}
      />

      {/* BLINK */}
      {blinkPhase && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          backgroundColor: "#000",
          opacity: blackOverlay ? 1 : 0,
          transition: "opacity 0.06s linear",
        }} />
      )}

      {/* CAR FRAMES */}
      {carPhase && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2 }}>
          {[1, 2, 3].map((n) => (
            <img key={n} src={`/images/car${n}.png`} alt="" aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 0, left: 0,
                width: "100%",
                height: isMobile ? "auto" : "100%",
                objectFit: isMobile ? "fill" : "cover",
                objectPosition: "center bottom",
                opacity: carFrame === n ? 1 : 0,
                transition: "opacity 0.15s ease",
              }}
            />
          ))}
        </div>
      )}

      {/* VIGNETTE */}
      {vignetteOpacity > 0 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          background: "radial-gradient(ellipse at 55% 50%, transparent 20%, rgba(0,0,0,0.6) 90%)",
          opacity: vignetteOpacity,
        }} />
      )}

      {/* DIALOG — fades in after animation, always starts at step 1 on mount */}
      {dialogOpacity > 0 && (
        <div style={{ opacity: dialogOpacity, position: "absolute", inset: 0, zIndex: 4 }}>
          <DialogSequence onComplete={onComplete} />
        </div>
      )}
    </div>
  );
}
