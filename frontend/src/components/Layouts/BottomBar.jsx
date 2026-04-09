import { useState } from "react";
import AddSong   from "../AddSong";
import GroupChat from "../Peripherals/GroupChat";
import History   from "../Peripherals/History";
import CircleBtn from "../CircleBtn";
import DarkPanel from "../DarkPanel";

import GlassPanel from "../GlassPanel";


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

      {/* Scoreboard button */}
      <CircleBtn onClick={handleVoteToggle} label="SCOREBOARD">
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
      <GlassPanel style={{ flex: 1, maxWidth: 560, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
          ADD SONG TO QUEUE
        </div>
        <AddSong partyEnded={partyEnded} />
      </GlassPanel>

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
