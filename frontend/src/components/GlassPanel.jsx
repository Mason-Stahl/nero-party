// Reusable glass panel — frosted glass look with backdrop blur.
// Inset highlight on top edge gives the "liquid" refraction feel.

export default function GlassPanel({ children, style }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16,
      backdropFilter: "blur(28px) saturate(160%)",
      WebkitBackdropFilter: "blur(28px) saturate(160%)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
      ...style,
    }}>
      {children}
    </div>
  );
}
