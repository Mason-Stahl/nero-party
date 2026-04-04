import { useEffect, useRef, useState } from "react";

const BG_IDLE  = "#161616";
const BG_HOVER = "#1c2b1c";

function BottomEQ({ active }) {
  const barsRef = useRef([]);
  const rafRef = useRef(null);
  const phases = useRef([0, 0.7, 1.4, 2.1, 2.8]);

  useEffect(() => {
    let running = true;

    const tick = (t) => {
      if (!running) return;

      const speed = active ? 7 : 2.2;
      const amp   = active ? 0.7 : 0.28;
      const base  = active ? 0.3 : 0.08;

      barsRef.current.forEach((bar, i) => {
        if (!bar) return;
        const val =
          base +
          amp *
            (0.5 +
              0.5 *
                Math.sin((t / 1000) * speed + phases.current[i]));

        bar.style.transform = `scaleY(${val})`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return (
    <span
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        height: 10,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "0 0 9999px 9999px",
      }}
    >
      <span
        style={{
          width: "60%",
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        {[3, 5, 4, 5, 3].map((h, i) => (
          <span
            key={i}
            ref={(el) => (barsRef.current[i] = el)}
            style={{
              flex: 1,
              height: h * 2,
              borderRadius: "2px 2px 0 0",
              background: "currentColor",
              transformOrigin: "bottom",
              transform: "scaleY(0.1)",
              willChange: "transform", // GPU hint
            }}
          />
        ))}
      </span>
    </span>
  );
}

export default function GlowButton({ children, onClick, disabled }) {
  const [active, setActive] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        borderRadius: 9999,
        border: "1px solid rgb(34,197,94)",
        background: active ? BG_HOVER : BG_IDLE,
        color: active
          ? "rgb(187,247,208)"
          : "rgb(134,239,172)",
        fontSize: 15,
        fontWeight: 300,
        padding: "10px 28px",
        minWidth: 120,
        cursor: "pointer",
        boxShadow: active
          ? "0 0 18px rgba(34,197,94,0.65)"
          : "0 0 12px rgba(34,197,94,0.45)",
        transform: active ? "scale(1.04)" : "scale(1)",
        transition:
          "background 0.25s, box-shadow 0.25s, transform 0.15s, color 0.2s",
        outline: "none",
      }}
    >
      {children}
      <BottomEQ active={active} />
    </button>
  );
}