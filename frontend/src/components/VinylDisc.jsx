// ── Spinning vinyl disc with thumbnail inset ───────────────────────────────────

export default function VinylDisc({ song, spinning, size }) {
  const r     = size / 2;
  const inner = r * 0.30;

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      animation: spinning ? "vinyl-spin 4s linear infinite" : "none",
      flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <circle cx={r} cy={r} r={r - 1} fill="#0d0d0d" />
        <circle cx={r} cy={r} r={r - 1} fill="none" stroke="#222" strokeWidth="0.5" />
        {[0.44, 0.39, 0.34, 0.30, 0.26, 0.22, 0.18].map((ratio, i) => (
          <circle key={i} cx={r} cy={r} r={r * ratio}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
        ))}
        <circle cx={r} cy={r} r={inner} fill={spinning ? "rgb(120,80,255)" : "#1a1a1a"} />
      </svg>

      {song?.thumbnailUrl && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: inner * 2, height: inner * 2,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%", overflow: "hidden", pointerEvents: "none",
        }}>
          <img src={song.thumbnailUrl} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 6, height: 6,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.1)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
