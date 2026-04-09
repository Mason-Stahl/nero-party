import { useState } from "react";
import { useParty } from "../context/PartyContext";
import { useIsMobile } from "../lib/useIsMobile";
import CircleBtn from "../components/CircleBtn";
import Btn from "../components/Btn";

const API = "http://localhost:3000";
const MUTED = "rgba(255,255,255,0.45)";

const MAX_LEN_OPTIONS = [
  { label: "OFF",   value: null },
  { label: "1:00",  value: 60 },
  { label: "2:00",  value: 120 },
  { label: "3:00",  value: 180 },
  { label: "5:00",  value: 300 },
  { label: "10:00", value: 600 },
];

const NAV_ITEMS = [
  { id: "invite",           label: "Invite" },
  { id: "queue-settings",   label: "Queue Settings" },
  { id: "banning",          label: "Banning" },
  { id: "party-management", label: "Party Management" },
];

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: MUTED,
      letterSpacing: "0.1em", marginBottom: 18,
    }}>
      {children}
    </div>
  );
}

// ── Invite ────────────────────────────────────────────────────────────────────

function InvitePanel() {
  const { joinCode, groupName } = useParty();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const joinLink = `${window.location.origin}/join/${joinCode}`;
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <SectionLabel>INVITE TO {groupName?.toUpperCase()}</SectionLabel>

      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
        Share this code or link with your crew so they can join the party.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          fontFamily: "monospace", fontSize: 22, fontWeight: 700, letterSpacing: "0.18em",
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
          color: "#fff", borderRadius: 10, padding: "8px 18px",
        }}>
          {joinCode}
        </div>
        <Btn
          size="sm"
          variant={copied ? "primary" : "ghost"}
          onClick={handleCopy}
          style={{ borderRadius: 10, whiteSpace: "nowrap" }}
        >
          {copied ? "copied!" : "copy link"}
        </Btn>
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 8 }}>
        {window.location.origin}/join/{joinCode}
      </p>
    </div>
  );
}

// ── Queue Settings ────────────────────────────────────────────────────────────

function QueueSettingsPanel({ autoAccept, onToggleAutoAccept }) {
  const { partyId, participantId } = useParty();
  const [maxLenIdx, setMaxLenIdx] = useState(0);
  const [loading, setLoading]     = useState({});
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const apiPatch = async (body, key) => {
    if (loading[key]) return;
    setLoad(key, true);
    try {
      await fetch(`${API}/parties/${partyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, ...body }),
      });
    } finally {
      setLoad(key, false);
    }
  };

  const handleToggleAutoAccept = async () => {
    const next = !autoAccept;
    onToggleAutoAccept(next);
    apiPatch({ autoAccept: next }, "autoAccept");
  };

  const handleMaxLenChange = (idx) => {
    setMaxLenIdx(idx);
    apiPatch({ maxSongLengthSec: MAX_LEN_OPTIONS[idx].value }, "maxLen");
  };

  return (
    <div>
      <SectionLabel>QUEUE SETTINGS</SectionLabel>

      {/* Auto Accept */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
          Auto Accept
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
          When on, submitted songs go straight to the queue. When off, you manually approve or reject each one.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CircleBtn
            onClick={handleToggleAutoAccept}
            label={autoAccept ? "ON" : "OFF"}
            disabled={!!loading.autoAccept}
          >
            {autoAccept ? "✓" : "✕"}
          </CircleBtn>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: autoAccept ? "rgb(34,197,94)" : "#f87171",
          }}>
            {autoAccept ? "Accepting all songs" : "Manual approval required"}
          </span>
        </div>
      </div>

      {/* Max Song Length */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
          Max Song Length
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
          Songs longer than this limit will be rejected on submission.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MAX_LEN_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => handleMaxLenChange(i)}
              style={{
                background:   i === maxLenIdx ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                border:       `1px solid ${i === maxLenIdx ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 8,
                color:        i === maxLenIdx ? "#fff" : "rgba(255,255,255,0.45)",
                fontFamily:   "monospace",
                fontSize:     13,
                fontWeight:   i === maxLenIdx ? 700 : 400,
                padding:      "6px 14px",
                cursor:       "pointer",
                transition:   "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Banning ───────────────────────────────────────────────────────────────────

function BanningPanel({ history = [], participants = [] }) {
  const { partyId, participantId } = useParty();
  const [loading, setLoading] = useState({});
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const apiCall = async (method, url, key) => {
    if (loading[key]) return;
    setLoad(key, true);
    try {
      await fetch(`${API}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
    } finally {
      setLoad(key, false);
    }
  };

  const handleBanSong = (songId) =>
    apiCall("DELETE", `/parties/${partyId}/songs/${songId}`, `ban-${songId}`);

  const handleKickUser = (kickId) =>
    apiCall("DELETE", `/parties/${partyId}/participants/${kickId}`, `kick-${kickId}`);

  // Show skipped/rejected songs from history
  const skippedSongs = history.filter((s) => s.status === "rejected" || s.status === "skipped");

  return (
    <div>
      <SectionLabel>BANNING</SectionLabel>

      {skippedSongs.length === 0 ? (
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          No skipped songs yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {skippedSongs.map((song) => {
            const submitter = participants.find((p) => p.id === song.addedByParticipantId);
            const submitterName = submitter?.displayName ?? "Unknown";
            return (
              <div
                key={song.id}
                style={{
                  display:      "flex",
                  alignItems:   "center",
                  gap:          12,
                  padding:      "10px 14px",
                  background:   "rgba(255,255,255,0.04)",
                  border:       "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                }}
              >
                {/* Song info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {song.title}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {song.artist} · by {submitterName}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleBanSong(song.id)}
                    disabled={!!loading[`ban-${song.id}`]}
                    style={{
                      background:   "rgba(248,113,113,0.12)",
                      border:       "1px solid rgba(248,113,113,0.25)",
                      borderRadius: 7,
                      color:        "#f87171",
                      fontSize:     11,
                      fontWeight:   600,
                      padding:      "4px 10px",
                      cursor:       "pointer",
                      opacity:      loading[`ban-${song.id}`] ? 0.4 : 1,
                    }}
                  >
                    Ban Song
                  </button>
                  {submitter && submitter.id !== participantId && (
                    <button
                      onClick={() => handleKickUser(submitter.id)}
                      disabled={!!loading[`kick-${submitter.id}`]}
                      style={{
                        background:   "rgba(251,191,36,0.1)",
                        border:       "1px solid rgba(251,191,36,0.2)",
                        borderRadius: 7,
                        color:        "#fbbf24",
                        fontSize:     11,
                        fontWeight:   600,
                        padding:      "4px 10px",
                        cursor:       "pointer",
                        opacity:      loading[`kick-${submitter.id}`] ? 0.4 : 1,
                      }}
                    >
                      Kick User
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Party Management ──────────────────────────────────────────────────────────

function PartyManagementPanel({ onEndParty, onGoToStage }) {
  const { partyId, participantId } = useParty();
  const [loading,  setLoading]  = useState(false);
  const [confirm,  setConfirm]  = useState(false);

  const handleEndParty = async () => {
    if (!confirm) { setConfirm(true); return; }
    setLoading(true);
    try {
      await fetch(`${API}/parties/${partyId}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      onEndParty();
      onGoToStage();
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  return (
    <div>
      <SectionLabel>PARTY MANAGEMENT</SectionLabel>

      <div style={{
        padding:      "20px 24px",
        background:   "rgba(248,113,113,0.06)",
        border:       "1px solid rgba(248,113,113,0.15)",
        borderRadius: 12,
        maxWidth:     400,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 6 }}>
          End Party
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16, lineHeight: 1.6 }}>
          This will stop playback, close the queue, and reveal the winning song. This cannot be undone.
        </div>
        <button
          onClick={handleEndParty}
          disabled={loading}
          style={{
            background:   confirm ? "rgba(248,113,113,0.85)" : "rgba(248,113,113,0.15)",
            border:       "1px solid rgba(248,113,113,0.4)",
            borderRadius: 8,
            color:        confirm ? "#fff" : "#f87171",
            fontSize:     12,
            fontWeight:   700,
            padding:      "8px 20px",
            cursor:       loading ? "not-allowed" : "pointer",
            opacity:      loading ? 0.5 : 1,
            transition:   "all 0.2s",
          }}
        >
          {loading ? "Ending…" : confirm ? "Click again to confirm" : "End Party"}
        </button>
        {confirm && (
          <button
            onClick={() => setConfirm(false)}
            style={{
              marginLeft:   10,
              background:   "none",
              border:       "none",
              color:        "rgba(255,255,255,0.35)",
              fontSize:     12,
              cursor:       "pointer",
            }}
          >
            cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── HostSettings (main) ───────────────────────────────────────────────────────

export default function HostSettings({
  autoAccept,
  onToggleAutoAccept,
  history,
  participants,
  onEndParty,
  onGoToStage,
}) {
  const isMobile = useIsMobile();
  const [active,      setActive]      = useState("invite");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNavSelect(id) {
    setActive(id);
    if (isMobile) setSidebarOpen(false);
  }

  const renderContent = () => {
    switch (active) {
      case "invite":
        return <InvitePanel />;
      case "queue-settings":
        return (
          <QueueSettingsPanel
            autoAccept={autoAccept}
            onToggleAutoAccept={onToggleAutoAccept}
          />
        );
      case "banning":
        return <BanningPanel history={history} participants={participants} />;
      case "party-management":
        return (
          <PartyManagementPanel
            onEndParty={onEndParty}
            onGoToStage={onGoToStage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      height:         "100%",
      minHeight:      "100vh",
      background:     "#0a0a0a",
      color:          "#fff",
      fontFamily:     "inherit",
      display:        "flex",
      flexDirection:  "column",
      position:       "relative",
      overflow:       "hidden",
    }}>
      {/* Navbar */}
      <nav style={{
        display:           "flex",
        alignItems:        "center",
        justifyContent:    "center",
        height:            64,
        borderBottom:      "1px solid rgba(255,255,255,0.07)",
        flexShrink:        0,
        position:          "relative",
        padding:           "0 24px",
        background:        "rgba(10,10,10,0.6)",
        backdropFilter:    "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              position:       "absolute",
              left:           16,
              background:     "none",
              border:         "none",
              color:          sidebarOpen ? "#fff" : MUTED,
              fontSize:       20,
              cursor:         "pointer",
              padding:        "4px 8px",
              display:        "flex",
              alignItems:     "center",
              lineHeight:     1,
              transition:     "color 0.15s",
            }}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        )}
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Host Settings
        </span>
        <button
          onClick={onGoToStage}
          title="Go to stage"
          style={{
            position:   "absolute",
            right:      24,
            background: "none",
            border:     "none",
            color:      MUTED,
            fontSize:   22,
            cursor:     "pointer",
            lineHeight: 1,
            padding:    4,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          ✕
        </button>
      </nav>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, position: "relative", overflow: "hidden" }}>

        {/* Mobile backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position:   "absolute",
              inset:      0,
              background: "rgba(0,0,0,0.55)",
              zIndex:     10,
            }}
          />
        )}

        {/* Sidebar */}
        <div style={{
          width:          200,
          flexShrink:     0,
          borderRight:    "1px solid rgba(255,255,255,0.07)",
          padding:        "24px 0",
          display:        "flex",
          flexDirection:  "column",
          gap:            2,
          ...(isMobile ? {
            position:   "absolute",
            top:        0,
            left:       0,
            height:     "100%",
            zIndex:     11,
            background: "#0a0a0a",
            borderRight: "1px solid rgba(255,255,255,0.12)",
            transform:  sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          } : {}),
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavSelect(item.id)}
                style={{
                  background:  isActive ? "rgba(255,255,255,0.06)" : "none",
                  border:      "none",
                  borderLeft:  isActive
                    ? "2px solid rgba(74,222,128,0.8)"
                    : "2px solid transparent",
                  color:       isActive ? "#fff" : MUTED,
                  fontFamily:  "inherit",
                  fontSize:    13,
                  fontWeight:  isActive ? 600 : 400,
                  textAlign:   "left",
                  padding:     "11px 24px",
                  cursor:      "pointer",
                  transition:  "all 0.15s ease",
                  width:       "100%",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: isMobile ? "24px 20px" : "36px 40px", overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
