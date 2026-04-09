// Reusable dark panel shell — matches the MixingTable's background aesthetic.
// background: dark gray gradient, subtle border, deep shadow, inset highlight.
// Optional Divider sub-component for the gradient separator line.

export function DarkDivider() {
  return (
    <div style={{
      height: 1,
      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)",
    }} />
  );
}

export default function DarkPanel({ children, clip = false, style }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #1e1e1e 0%, #111 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      overflow: clip ? "hidden" : "visible",
      boxShadow: "0 8px 40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)",
      ...style,
    }}>
      {children}
    </div>
  );
}
