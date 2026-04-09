import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParty } from "../context/PartyContext";
import { useIsMobile } from "../lib/useIsMobile";
import TopBar       from "../components/Layouts/TopBar";
import MiddleZone   from "../components/Layouts/MiddleZone";
import BottomBar    from "../components/Layouts/BottomBar";
import HostSettings from "./HostSettings";
import MobileNavbar, { NAVBAR_H } from "./MobileNavbar";
import AddSong      from "../components/AddSong";
import Scoreboard   from "../components/Scoreboard";
import History      from "../components/Peripherals/History";
import GroupChat    from "../components/Peripherals/GroupChat";

const BLOBS = (
  <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
    <div style={{
      position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
      width: 600, height: 600,
      background: "radial-gradient(circle, rgba(74,222,128,0.05), transparent 70%)",
      filter: "blur(40px)",
    }} />
    <div style={{
      position: "absolute", bottom: "-10%", left: "-5%",
      width: 500, height: 500,
      background: "radial-gradient(circle, rgba(120,80,255,0.05), transparent 70%)",
      filter: "blur(40px)",
    }} />
    <div style={{
      position: "absolute", bottom: "-10%", right: "-5%",
      width: 500, height: 500,
      background: "radial-gradient(circle, rgba(34,211,238,0.05), transparent 70%)",
      filter: "blur(40px)",
    }} />
  </div>
);

export default function StagePage({ onLeave }) {
  const { partyId, participantId, isHost } = useParty();
  const isMobile = useIsMobile();

  const socketRef                       = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [history,      setHistory]      = useState([]);
  const [connected,    setConnected]    = useState(false);
  const [playback,     setPlayback]     = useState({ isPaused: false, effectiveStartTime: null });
  const [messages,     setMessages]     = useState([]);
  const [partyEnded,   setPartyEnded]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mobile-only: which tab is active + unread tracking
  const [activePage,  setActivePage]  = useState("home");
  const [mobileSeen,  setMobileSeen]  = useState(0);
  const mobileUnread = Math.max(0, messages.length - mobileSeen);

  function handleMobilePageChange(page) {
    if (page === "chat") setMobileSeen(messages.length);
    setActivePage(page);
  }

  function handleSendMessage(body) {
    socketRef.current?.emit("send-message", { partyId, participantId, body });
  }

  useEffect(() => {
    if (!partyId || !participantId) return;

    fetch(`http://localhost:3000/parties/${partyId}/songs`)
      .then((r) => r.json()).then(setQueue).catch(() => {});
    fetch(`http://localhost:3000/parties/${partyId}/songs/history`)
      .then((r) => r.json()).then(setHistory).catch(() => {});
    fetch(`http://localhost:3000/parties/${partyId}/messages`)
      .then((r) => r.json()).then(setMessages).catch(() => {});

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect",              () => { setConnected(true); socket.emit("join-party", { partyId, participantId }); });
    socket.on("participants-updated", setParticipants);
    socket.on("queue-updated",        setQueue);
    socket.on("playback-updated",     setPlayback);
    socket.on("history-updated",      setHistory);
    socket.on("chat-message",         (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("party-ended",          () => setPartyEnded(true));
    socket.on("disconnect",           () => setConnected(false));

    return () => socket.disconnect();
  }, [partyId, participantId]);

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0a0a0a" }}>
        {BLOBS}

        {/* Content area — fills everything above the navbar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: NAVBAR_H, zIndex: 1 }}>

          {/* HOME: inline scoreboard + queue/table + search bar */}
          {activePage === "home" && (
            <div style={{
              position:      "absolute",
              inset:         0,
              display:       "flex",
              flexDirection: "column",
              overflow:      "hidden",
            }}>
              {/* Scoreboard — compact inline at top */}
              <div style={{ flexShrink: 0, zIndex: 2 }}>
                <Scoreboard
                  songs={history}
                  participants={participants}
                  connected={connected}
                  inline
                />
              </div>

              {/* Queue / MixingTable — fills remaining space */}
              <div style={{ flex: 1, position: "relative", overflow: "visible", zIndex: 1 }}>
                <MiddleZone
                  isHost={isHost}
                  songs={queue}
                  history={history}
                  participants={participants}
                  isPaused={playback.isPaused}
                  effectiveStartTime={playback.effectiveStartTime}
                />
              </div>

              {/* AddSong — pinned at bottom of home page */}
              <div style={{
                flexShrink:     0,
                padding:        "10px 16px",
                background:     "rgba(0,0,0,0.75)",
                backdropFilter: "blur(14px)",
                borderTop:      "1px solid rgba(255,255,255,0.08)",
                zIndex:         2,
              }}>
                <AddSong partyEnded={partyEnded} />
              </div>
            </div>
          )}

          {/* VOTE: full-page history + scoreboard */}
          {activePage === "vote" && (
            <History
              fullPage
              songs={history}
              participants={participants}
              connected={connected}
            />
          )}

          {/* CHAT: full-page group chat */}
          {activePage === "chat" && (
            <GroupChat
              fullPage
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>

        {/* Fixed bottom navbar */}
        <MobileNavbar
          activePage={activePage}
          onChange={handleMobilePageChange}
          unreadCount={mobileUnread}
        />
      </div>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0a0a0a" }}>
      {BLOBS}

      {/* TOP (0–20%) */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "20%", zIndex: 5 }}>
        <TopBar
          songs={history}
          participants={participants}
          connected={connected}
          onLeave={onLeave}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Host Settings overlay */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <HostSettings onGoToStage={() => setShowSettings(false)} />
        </div>
      )}

      {/* MIDDLE (20–70%) */}
      <div style={{ position: "absolute", top: "20%", left: 0, right: 0, height: "50%", overflow: "visible", zIndex: 2 }}>
        <MiddleZone
          isHost={isHost}
          songs={queue}
          history={history}
          participants={participants}
          isPaused={playback.isPaused}
          effectiveStartTime={playback.effectiveStartTime}
        />
      </div>

      {/* BOTTOM (70–100%) */}
      <div style={{ position: "absolute", top: "70%", left: 0, right: 0, bottom: 0, zIndex: 5 }}>
        <BottomBar
          messages={messages}
          onSendMessage={handleSendMessage}
          partyEnded={partyEnded}
          songs={history}
          participants={participants}
          connected={connected}
        />
      </div>
    </div>
  );
}
