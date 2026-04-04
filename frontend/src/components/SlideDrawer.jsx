import { useState } from "react";
import { createPortal } from "react-dom";

const CREAM = "#fdf8e1";
const EAR   = 11;

// ── DogEarTab ─────────────────────────────────────────────────────────────────

function DogEarTab({ label, subtext, side, onClick }) {
  // left-side tab: dog-ear cuts the top-right corner
  // right-side tab: dog-ear cuts the top-left corner
  const clipPath = side === "right"
    ? `polygon(${EAR}px 0, 100% 0, 100% 100%, 0 100%, 0 ${EAR}px)`
    : `polygon(0 0, calc(100% - ${EAR}px) 0, 100% ${EAR}px, 100% 100%, 0 100%)`;

  const foldPos = side === "right"
    ? { top: 0, left: 0, background: "linear-gradient(315deg, rgba(0,0,0,0.18) 100%, transparent 50%)" }
    : { top: 0, right: 0, background: "linear-gradient(225deg, rgba(0,0,0,0.18) 100%, transparent 50%)" };

  return (
    <div
      onClick={onClick}
      style={{
        width:          80,
        height:         60,
        background:     CREAM,
        border:         "1px solid #000",
        borderLeft: "none",
        clipPath,
        cursor:         "pointer",
        position:       "relative",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "flex-start",
        justifyContent: "center",
        padding:        "0 10px",
        userSelect:     "none",
      }}
    >
      <div style={{
        position:      "absolute",
        width:         EAR,
        height:        EAR,
        pointerEvents: "none",
        ...foldPos,
      }} />
      <span style={{
        fontFamily:    "sans-serif",
        fontSize:      11,
        fontWeight:    700,
        letterSpacing: "0.08em",
        color:         "#222",
        lineHeight:    1,
        marginBottom:  4,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "sans-serif",
        fontSize:   10,
        color:      "rgba(0,0,0,0.45)",
        lineHeight: 1,
      }}>
        {subtext}
      </span>
    </div>
  );
}

// ── SlideDrawer ───────────────────────────────────────────────────────────────
// Generic slide-in panel with dog-ear tab, mounted via portal to escape
// any ancestor overflow/stacking constraints.
//
// Props:
//   side        "left" | "right"          which edge to slide from
//   tabTop      CSS top value             e.g. "10%", "50%"
//   tabYOffset  CSS translateY value      e.g. "0", "-50%" for centering
//   tabLabel    string                    bold line in the tab
//   tabSubtext  string                    smaller line in the tab
//   panelWidth  CSS width string          default "30vw"
//   minWidth    number (px)               default 260
//   children    ReactNode                 the full panel content

export default function SlideDrawer({
  side       = "left",
  tabTop     = "50%",
  tabYOffset = "-50%",
  tabLabel,
  tabSubtext,
  panelWidth = "30vw",
  minWidth   = 260,
  children,
}) {
  const [open, setOpen] = useState(false);

  const closedTranslate = side === "right" ? "translateX(100%)"  : "translateX(-100%)";

  return createPortal(
    <>
      {/* overlay — click outside to close */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 19, cursor: "default" }}
        />
      )}

      {/* panel */}
      <div style={{
        position:   "fixed",
        top:        0,
        [side]:     0,
        width:      panelWidth,
        minWidth,
        height:     "100vh",
        zIndex:     20,
        transform:  open ? "translateX(0)" : closedTranslate,
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display:    "flex",
        flexDirection: "column",
        boxShadow:  side === "right"
          ? "-4px 0 24px rgba(0,0,0,0.5)"
          :  "4px 0 24px rgba(0,0,0,0.5)",
      }}>
        {children}
      </div>

      {/* tab — hidden while panel is open so panel slides over it */}
      {!open && (
        <div style={{
          position:  "fixed",
          [side]:    0,
          top:       tabTop,
          transform: `translateY(${tabYOffset})`,
          zIndex:    15,
        }}>
          <DogEarTab
            label={tabLabel}
            subtext={tabSubtext}
            side={side}
            onClick={() => setOpen(true)}
          />
        </div>
      )}
    </>,
    document.body
  );
}
