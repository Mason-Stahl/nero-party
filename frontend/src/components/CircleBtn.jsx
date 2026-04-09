// ── shared circular icon button ────────────────────────────────────────────────

import { useState } from "react";

export default function CircleBtn({ onClick, label, badge, disabled = false, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <button
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={disabled}
        style={{
          position:       "relative",
          width:          48,
          height:         48,
          borderRadius:   "50%",
          background:     disabled
            ? "rgba(255,255,255,0.03)"
            : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
          border:         "1px solid rgba(255,255,255,0.12)",
          cursor:         disabled ? "not-allowed" : "pointer",
          color:          disabled ? "rgba(255,255,255,0.2)" : "#fff",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "background 0.15s",
          flexShrink:     0,
          opacity:        disabled ? 0.35 : 1,
        }}
      >
        {children}
        {badge > 0 && (
          <div style={{
            position:       "absolute",
            top:            -4,
            right:          -4,
            width:          18,
            height:         18,
            borderRadius:   "50%",
            background:     "rgb(34,197,94)",
            color:          "#000",
            fontSize:       9,
            fontWeight:     700,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}>
            {badge > 9 ? "9+" : badge}
          </div>
        )}
      </button>
      <span style={{
        fontSize:      9,
        fontWeight:    600,
        letterSpacing: "0.06em",
        color:         "rgba(255,255,255,0.45)",
        userSelect:    "none",
        whiteSpace:    "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}
