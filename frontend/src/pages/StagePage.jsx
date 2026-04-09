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
import CircleBtn    from "../components/CircleBtn";
import Scoreboard   from "../components/Scoreboard";
import History      from "../components/Peripherals/History";
import GroupChat    from "../components/Peripherals/GroupChat";

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
  </svg>
);

const API = "http://localhost:3000";

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
  const { partyId, participantId, isHost, autoAccept: initAutoAccept } = useParty();
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

  // Lifted from MixingTable so both MiddleZone and HostSettings can read/write it
  const [autoAccept, setAutoAccept] = useState(initAutoAccept ?? true);

  // Winner popup — shown when host ends the party
  const [showWinner, setShowWinner] = useState(false);

  // Mobile-only: which tab is active + unread tracking
  const [activePage,  setActivePage]  = useState("home");
  const [mobileSeen,  setMobileSeen]  = useState(0);
  const mobileUnread = Math.max(0, messages.length - mobileSeen);

  // Compute winning song from history
  const songScores = history
    .map((s) => {
      const ratings = s.ratings ?? [];
      const avg = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length / 2
        : 0;
      return { ...s, avg };
    })
    .filter((s) => s.avg > 0)
    .sort((a, b) => b.avg - a.avg);
  const winningSong = songScores[0] ?? null;
  const winnerPart  = winningSong
    ? participants.find((p) => p.id === winningSong.addedByParticipantId)
    : null;
  const winnerName  = winnerPart?.displayName ?? "Unknown";

  function handleMobilePageChange(page) {
    if (page === "chat") setMobileSeen(messages.length);
    setActivePage(page);
  }

  function handleSendMessage(body) {
    socketRef.current?.emit("send-message", { partyId, participantId, body });
  }

  // Called by HostSettings when auto-accept is toggled
  function handleToggleAutoAccept(next) {
    setAutoAccept(next);
  }

  // Called by HostSettings when party is ended
  function handleEndParty() {
    setShowWinner(true);
    setPartyEnded(true);
  }

  useEffect(() => {
    if (!partyId || !participantId) return;

    fetch(`${API}/parties/${partyId}/songs`)
      .then((r) => r.json()).then(setQueue).catch(() => {});
    fetch(`${API}/parties/${partyId}/songs/history`)
      .then((r) => r.json()).then(setHistory).catch(() => {});
    fetch(`${API}/parties/${partyId}/messages`)
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

  // ── Winner popup ─────────────────────────────────────────────────────────────
  const winnerPopup = showWinner && (
    <div
      onClick={() => setShowWinner(false)}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #1e1e1e 0%, #111 100%)",
          border: "1px solid rgba(245,197,24,0.45)",
          borderRadius: 16,
          padding: "36px 44px",
          textAlign: "center",
          boxShadow: "0 8px 60px rgba(245,197,24,0.18), 0 0 0 1px rgba(245,197,24,0.08)",
          maxWidth: 420,
          width: "90vw",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>🏆</div>
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.24em",
          color: "rgba(255,255,255,0.35)", marginBottom: 18,
        }}>
          PARTY OVER — WINNING SONG
        </div>

        {winningSong ? (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f5c518", marginBottom: 6, lineHeight: 1.2 }}>
              {winningSong.title}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              {winningSong.artist}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(245,197,24,0.08)",
              border: "1px solid rgba(245,197,24,0.2)",
              borderRadius: 8, padding: "8px 16px", marginBottom: 12,
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>submitted by</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{winnerName}</span>
            </div>
            <div style={{ fontSize: 16, color: "#f5c518", fontWeight: 700, letterSpacing: "0.05em" }}>
              {winningSong.avg.toFixed(1)} ★
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            No rated songs yet.
          </div>
        )}

        <button
          onClick={() => setShowWinner(false)}
          style={{
            marginTop: 28, padding: "8px 24px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 8, cursor: "pointer",
            fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0a0a0a" }}>
        {BLOBS}
        {winnerPopup}

        {/* Host Settings overlay */}
        {showSettings && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "auto" }}>
            <HostSettings
              autoAccept={autoAccept}
              onToggleAutoAccept={handleToggleAutoAccept}
              history={history}
              participants={participants}
              onEndParty={handleEndParty}
              onGoToStage={() => setShowSettings(false)}
            />
          </div>
        )}

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: NAVBAR_H, zIndex: 1 }}>
          {activePage === "home" && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{ flexShrink: 0, zIndex: 2 }}>
                <Scoreboard
                  songs={history}
                  participants={participants}
                  connected={connected}
                  onLeave={onLeave}
                  inline
                  section="status"
                />
              </div>

              <div style={{ flex: 1, position: "relative", overflow: "visible", zIndex: 1 }}>
                <div style={{ position: "absolute", top: "12%", bottom: "6%", left: 0, right: 0 }}>
                  <MiddleZone
                    isHost={isHost}
                    songs={queue}
                    history={history}
                    participants={participants}
                    isPaused={playback.isPaused}
                    effectiveStartTime={playback.effectiveStartTime}
                    autoAccept={autoAccept}
                  />
                </div>
              </div>

              <div style={{
                flexShrink: 0,
                padding: "10px 16px",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(14px)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <AddSong partyEnded={partyEnded} />
                </div>
                {isHost && (
                  <CircleBtn onClick={() => setShowSettings(true)} label="SETTINGS">
                    <GearIcon />
                  </CircleBtn>
                )}
              </div>
            </div>
          )}

          {activePage === "vote" && (
            <History
              fullPage
              songs={history}
              participants={participants}
              connected={connected}
            />
          )}

          {activePage === "chat" && (
            <GroupChat
              fullPage
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>

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
      {winnerPopup}

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
          <HostSettings
            autoAccept={autoAccept}
            onToggleAutoAccept={handleToggleAutoAccept}
            history={history}
            participants={participants}
            onEndParty={handleEndParty}
            onGoToStage={() => setShowSettings(false)}
          />
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
          autoAccept={autoAccept}
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
