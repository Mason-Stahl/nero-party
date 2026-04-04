/**
 * DialogBubble
 *
 * mode="user" — arrow bottom-left, pointing down
 * mode="bouncer"    — arrow top-right,   pointing right
 *
 * Props:
 *   mode      "bouncer" | "user"
 *   text      bold heading string
 *   subtext   secondary string (optional)
 *   children  any additional elements rendered below text
 */

const BG     = "rgb(220, 220, 220)";
const BORDER = "rgba(189, 189, 189, 0.35)";
const ARROW  = 20;
const R      = 26;

/**
 * Props:
 *   mode        "bouncer" | "user"
 *   text        bold heading string
 *   textInput   optional — renders an inline input after the text on the same line
 *   subtext     secondary string (optional)
 *   children    any additional elements rendered below
 */
export default function DialogBubble({ mode = "bouncer", text, textInput, subtext, children, onBack }) {
  const isBouncer = mode === "bouncer";

  return (
    <div style={{
      position: "relative",
      display: "inline-block",
      background: BG,
      border: `1.5px solid ${BORDER}`,
      borderRadius: R,
      padding: "20px 26px",
      minWidth: 200,
      maxWidth: 360,
      boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
      marginBottom: isBouncer ? ARROW : 0,
      marginTop:    isBouncer ? 0 : ARROW,
    }}>

      {isBouncer ? <BouncerArrow /> : <UserArrow />}

      {onBack && (
        <button
          onClick={onBack}
          style={{
            position:   "absolute",
            top:        4,
            left:       24,
            background: "none",
            border:     "none",
            cursor:     "pointer",
            fontSize:   16,
            color:      "rgba(0,0,0,0.5)",
            lineHeight: 1,
            padding:    1,
          }}
          title="Back"
        >
          ←
        </button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#111", lineHeight: 1.3 }}>
          {text}
        </span>
        {textInput}
      </div>

      {subtext && (
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "rgba(0, 0, 0, 0.7)", lineHeight: 1.4 }}>
          {subtext}
        </p>
      )}

      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
}

// Bottom-left, points down
function UserArrow() {
  return (
    <>
      <div style={{
        position: "absolute",
        bottom: -ARROW - 1, left: 28,
        width: 0, height: 0,
        borderLeft:  `${ARROW}px solid transparent`,
        borderRight: `${ARROW}px solid transparent`,
        borderTop:   `${ARROW}px solid ${BORDER}`,
      }} />
      <div style={{
        position: "absolute",
        bottom: -ARROW + 1, left: 28,
        width: 0, height: 0,
        borderLeft:  `${ARROW}px solid transparent`,
        borderRight: `${ARROW}px solid transparent`,
        borderTop:   `${ARROW}px solid ${BG}`,
      }} />
    </>
  );
}

// Top-right, points right
function BouncerArrow() {
  return (
    <>
      <div style={{
        position: "absolute",
        top: 18, right: -ARROW - 1,
        width: 0, height: 0,
        borderTop:    `${ARROW}px solid transparent`,
        borderBottom: `${ARROW}px solid transparent`,
        borderLeft:   `${ARROW}px solid ${BORDER}`,
      }} />
      <div style={{
        position: "absolute",
        top: 18, right: -ARROW + 1,
        width: 0, height: 0,
        borderTop:    `${ARROW}px solid transparent`,
        borderBottom: `${ARROW}px solid transparent`,
        borderLeft:   `${ARROW}px solid ${BG}`,
      }} />
    </>
  );
}
