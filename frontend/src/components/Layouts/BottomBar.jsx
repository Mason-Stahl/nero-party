import { useState, useEffect } from "react";
import AddSong from "../components/AddSong";
import GroupChat from "../components/Peripherals/GroupChat";

export default function BottomBar({ messages, onSendMessage, partyEnded }) {
  const [chatOpen,  setChatOpen]  = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [hovered,   setHovered]   = useState(false);

  const unread = Math.max(0, messages.length - seenCount);

  useEffect(() => {
    if (chatOpen) setSeenCount(messages.length);
  }, [messages, chatOpen]);

  function handleToggle() {
    setChatOpen((o) => {
      if (!o) setSeenCount(messages.length);
      return !o;
    });
  }

  return (
    // Vertically center the bar content within the bottom zone
    <div style={{
      position:       "absolute",
      inset:          0,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "0 24px",
      gap:            16,
    }}>

      {/* Search bar */}
      <div style={{ flex: 1, maxWidth: 560 }}>
        <AddSong partyEnded={partyEnded} />
      </div>

      {/* Group Chat button + label */}
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:            5,
        flexShrink:     0,
      }}>
        <button
          onClick={handleToggle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width:              48,
            height:             48,
            borderRadius:       "50%",
            background:         hovered
              ? "rgba(255,255,255,0.16)"
              : chatOpen
                ? "rgba(255,255,255,0.13)"
                : "rgba(255,255,255,0.09)",
            border:             `1px solid ${chatOpen ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)"}`,
            cursor:             "pointer",
            display:            "flex",
            alignItems:         "center",
            justifyContent:     "center",
            position:           "relative",
            backdropFilter:     "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            transition:         "background 0.15s, border-color 0.15s",
            boxShadow:          "0 2px 12px rgba(0,0,0,0.35)",
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="rgba(255,255,255,0.8)" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>

          {/* Unread badge */}
          {unread > 0 && (
            <div style={{
              position:       "absolute",
              top:            -3, right: -3,
              background:     "#e74c3c",
              color:          "#fff",
              borderRadius:   "50%",
              width:          16, height: 16,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       8,
              fontWeight:     700,
              border:         "1.5px solid #0a0a0a",
            }}>
              {unread > 9 ? "9+" : unread}
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
          GROUP CHAT
        </span>
      </div>

      {/* Group Chat slide-in panel (portal) */}
      <GroupChat
        open={chatOpen}
        onClose={handleToggle}
        messages={messages}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
