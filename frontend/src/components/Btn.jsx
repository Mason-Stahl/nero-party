import { useState } from "react";

const GREEN = "#4ade80";

const variants = {
  ghost: {
    base: {
      background: "rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.8)",
      border: "1px solid rgba(255,255,255,0.14)",
    },
    hover: {
      background: "rgba(255,255,255,0.16)",
      boxShadow: "0 0 14px rgba(255,255,255,0.06)",
    },
  },
  primary: {
    base: {
      background: GREEN,
      color: "#000",
      border: `1px solid ${GREEN}`,
    },
    hover: {
      background: "#6ee7a0",
      boxShadow: `0 0 18px rgba(74,222,128,0.35)`,
    },
  },
  danger: {
    base: {
      background: "rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.45)",
      border: "1px solid rgba(255,255,255,0.12)",
    },
    hover: {
      background: "rgba(248,113,113,0.18)",
      color: "#f87171",
      border: "1px solid rgba(248,113,113,0.28)",
      boxShadow: "0 0 14px rgba(248,113,113,0.12)",
    },
  },
};

const sizes = {
  sm: { fontSize: 12, padding: "5px 14px", borderRadius: 12 },
  md: { fontSize: 13, padding: "7px 20px", borderRadius: 20 },
  lg: { fontSize: 15, padding: "11px 28px", borderRadius: 20 },
};

export default function Btn({
  children,
  onClick,
  disabled = false,
  variant = "ghost",
  size = "md",
  fullWidth = false,
  style: overrides = {},
  ...rest
}) {
  const [hovered, setHovered] = useState(false);

  const v = variants[variant] ?? variants.ghost;
  const s = sizes[size] ?? sizes.md;

  const isActive = hovered && !disabled;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontFamily: "inherit",
        fontWeight: 600,
        letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        width: fullWidth ? "100%" : undefined,
        transform: isActive ? "scale(1.04)" : "scale(1)",
        transition: "transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
        userSelect: "none",
        // size
        ...s,
        // variant base
        ...v.base,
        // hover overrides
        ...(isActive ? v.hover : {}),
        // caller overrides (applied last)
        ...overrides,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
