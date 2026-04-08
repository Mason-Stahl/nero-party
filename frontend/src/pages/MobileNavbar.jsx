// MobileNavbar — fixed bottom tab bar for mobile layout.
// Three tabs: Vote | Home | Chat

const ACTIVE_COLOR  = "rgb(34,197,94)";
const INACTIVE_COLOR = "rgba(255,255,255,0.38)";
const NAV_H = 56;

function Tab({ icon, label, active, onClick, badge }) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
  return (
    <button
      onClick={onClick}
      style={{
        flex:           1,
        height:         "100%",
        background:     "none",
        border:         "none",
        cursor:         "pointer",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            3,
        padding:        0,
        position:       "relative",
        transition:     "opacity 0.15s",
      }}
    >
      {/* active indicator bar at top */}
      <div style={{
        position:     "absolute",
        top:          0,
        left:         "20%",
        right:        "20%",
        height:       2,
        borderRadius: "0 0 2px 2px",
        background:   active ? ACTIVE_COLOR : "transparent",
        transition:   "background 0.2s",
      }} />

      {/* icon + optional badge */}
      <div style={{ position: "relative" }}>
        <div style={{ color, transition: "color 0.2s" }}>
          {icon}
        </div>
        {badge > 0 && (
          <div style={{
            position:       "absolute",
            top:            -5,
            right:          -7,
            minWidth:       16,
            height:         16,
            borderRadius:   8,
            background:     ACTIVE_COLOR,
            color:          "#000",
            fontSize:       9,
            fontWeight:     700,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            padding:        "0 3px",
          }}>
            {badge > 9 ? "9+" : badge}
          </div>
        )}
      </div>

      <span style={{
        fontFamily:    "sans-serif",
        fontSize:      9,
        fontWeight:    active ? 700 : 500,
        letterSpacing: "0.07em",
        color,
        transition:    "color 0.2s",
      }}>
        {label}
      </span>
    </button>
  );
}

export const NAVBAR_H = NAV_H;

export default function MobileNavbar({ activePage, onChange, unreadCount = 0 }) {
  return (
    <div style={{
      position:       "fixed",
      bottom:         0,
      left:           0,
      right:          0,
      height:         NAV_H,
      background:     "rgba(8,8,12,0.96)",
      backdropFilter: "blur(16px)",
      borderTop:      "1px solid rgba(255,255,255,0.1)",
      display:        "flex",
      alignItems:     "stretch",
      zIndex:         30,
    }}>

      {/* Vote */}
      <Tab
        active={activePage === "vote"}
        onClick={() => onChange("vote")}
        label="VOTE"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
            <path d="M4 22h16"/>
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
          </svg>
        }
      />

      {/* Home */}
      <Tab
        active={activePage === "home"}
        onClick={() => onChange("home")}
        label="HOME"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        }
      />

      {/* Chat */}
      <Tab
        active={activePage === "chat"}
        onClick={() => onChange("chat")}
        label="CHAT"
        badge={unreadCount}
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        }
      />
    </div>
  );
}
