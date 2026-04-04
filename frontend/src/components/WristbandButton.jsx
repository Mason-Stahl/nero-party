/**
 * WristbandButton
 * variant="host" — green band, black text
 * variant="join" — black band, white text, green border
 */
export default function WristbandButton({ variant = "join", children, onClick }) {
  const isHost = variant === "host";

  const theme = isHost
    ? { bg: "rgba(34,197,94,0.85)", text: "#000", border: "#000",    glow: "rgba(34,197,94,0.4)", tabLines: "rgba(0,0,0,0.18)" }
    : { bg: "#0a0a0a",              text: "rgb(34,197,94)", border: "rgb(34,197,94)", glow: "rgba(34,197,94,0.4)", tabLines: "rgba(0,0,0,0.5)" };

  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "stretch",
        height: 36,
        border: "none",
        background: "none",
        padding: 0,
        cursor: "pointer",
        outline: "none",
        filter: `drop-shadow(0 2px 8px ${theme.glow})`,
        transition: "filter 0.2s, transform 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.filter    = `drop-shadow(0 3px 14px ${theme.glow}) brightness(1.1)`;
        e.currentTarget.style.transform = "scale(1.04)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.filter    = `drop-shadow(0 2px 8px ${theme.glow})`;
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {/* Left tab — white with diagonal lines */}
      <div style={{
        width: 14,
        background: "#fffffff5",
        border: `0px solid ${theme.border}`,
        borderRight: "none",
        borderRadius: "4px 0 0 4px",
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 3px,
            ${theme.tabLines} 3px,
            ${theme.tabLines} 4px
          )`,
          pointerEvents: "none",
        }} />
      </div>

      {/* Band body */}
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        width: 122,
        justifyContent: "center",
        background: theme.bg,
        border: `0px solid ${theme.border}`,
        borderLeft: "none",
        borderRadius: "0 4px 4px 0",
        overflow: "hidden",
      }}>

        <span style={{
          position: "relative",
          fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
          fontWeight: 900,
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: theme.text,
          userSelect: "none",
          whiteSpace: "nowrap",
        }}>
          {children}
        </span>
      </div>
    </button>
  );
}
