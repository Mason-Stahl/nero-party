// ── shared circular icon button ────────────────────────────────────────────────

import { useState } from "react";

export default function CircleBtn({ onClick, label, badge, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position:       "relative",
          width:          48,
          height:         48,
          borderRadius:   "50%",
          background:     hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
          border:         "1px solid rgba(255,255,255,0.12)",
          cursor:         "pointer",
          color:          "#fff",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "background 0.15s",
          flexShrink:     0,
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