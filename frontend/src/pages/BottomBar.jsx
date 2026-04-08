import { useState } from "react";
import AddSong   from "../components/AddSong";
import GroupChat from "../components/Peripherals/GroupChat";
import History   from "../components/Peripherals/History";

// ── shared circular icon button ────────────────────────────────────────────────
function CircleBtn({ onClick, label, badge, children }) {
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

// ── BottomBar ──────────────────────────────────────────────────────────────────
export default function BottomBar({ messages, onSendMessage, partyEnded, songs, participants, connected }) {
  const [chatOpen,  setChatOpen]  = useState(false);
  const [voteOpen,  setVoteOpen]  = useState(false);
  const [seenCount, setSeenCount] = useState(0);

  const unread = Math.max(0, messages.length - seenCount);

  function handleChatToggle() {
    if (!chatOpen) setSeenCount(messages.length);
    setChatOpen((o) => !o);
  }

  function handleVoteToggle() {
    setVoteOpen((o) => !o);
  }

  return (
    <div style={{
      position:        "absolute",
      inset:           0,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         "0 24px",
      gap:             16,
    }}>

      {/* Vote button */}
      <CircleBtn onClick={handleVoteToggle} label="VOTE">
        {/* trophy icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      </CircleBtn>

      {/* Song search */}
      <div style={{ flex: 1, maxWidth: 560 }}>
        <AddSong partyEnded={partyEnded} />
      </div>

      {/* Group chat button */}
      <CircleBtn onClick={handleChatToggle} label="GROUP CHAT" badge={unread}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </CircleBtn>

      {/* Panels */}
      <History
        open={voteOpen}
        onClose={handleVoteToggle}
        songs={songs}
        participants={participants}
        connected={connected}
      />
      <GroupChat
        open={chatOpen}
        onClose={handleChatToggle}
        messages={messages}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
