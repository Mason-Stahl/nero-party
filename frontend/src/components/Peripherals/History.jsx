import { useState } from "react";
import { createPortal } from "react-dom";
import { useParty } from "../../context/PartyContext";
import Scoreboard from "../Scoreboard";
import StarRating from "./StarRating";
import Playlist from "./Playlist";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDuration(sec) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function avgDisplay(ratings) {
  if (!ratings?.length) return null;
  const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
  return (avg / 2).toFixed(1);
}

// ── SongRow ───────────────────────────────────────────────────────────────────

function SongRow({ song, number, participantId, partyId, expanded, onToggle }) {
  const [pendingStars, setPendingStars] = useState(0);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState(null);
  const [hovered,      setHovered]      = useState(false);

  const isOwn    = song.addedByParticipantId === participantId;
  const myRating = song.ratings?.find((r) => r.participantId === participantId);
  const avg      = avgDisplay(song.ratings);
  const isRated  = submitted || !!myRating;
  const dispStars = pendingStars || (myRating ? myRating.stars / 2 : 0);

  const handleRate = async (e) => {
    e.stopPropagation();
    if (!pendingStars) return;
    try {
      const res = await fetch(
        `http://localhost:3000/parties/${partyId}/songs/${song.id}/rate`,
        {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ participantId, stars: pendingStars }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setSubmitted(true);
      setError(null);
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {/* song row */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        10,
          padding:    "9px 14px",
          cursor:     "pointer",
          background: hovered ? "rgba(255,255,255,0.04)" : "transparent",
          transition: "background 0.12s",
        }}
      >
        <span style={{
          width:      22,
          flexShrink: 0,
          textAlign:  "right",
          fontSize:   10,
          fontFamily: "monospace",
          color:      "rgba(255,255,255,0.25)",
        }}>
          {number}
        </span>
        <span style={{
          flex:         1,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          fontFamily:   "sans-serif",
          fontSize:     13,
          color:        "rgba(255,255,255,0.85)",
        }}>
          {song.title}
        </span>
        {avg !== null && (
          <span style={{
            fontSize:    10,
            fontFamily:  "monospace",
            color:       "rgba(255,220,100,0.7)",
            flexShrink:  0,
          }}>
            ★{avg}
          </span>
        )}
        <span style={{
          fontSize:   10,
          color:      "rgba(255,255,255,0.2)",
          flexShrink: 0,
        }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* rating box */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            margin:       "0 14px 10px 46px",
            background:   "rgba(255,255,255,0.05)",
            border:       "1px solid rgba(255,255,255,0.09)",
            borderRadius: 8,
            padding:      "8px 12px",
            fontFamily:   "sans-serif",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{song.artist}</span>
            {song.durationSec ? ` · ${formatDuration(song.durationSec)}` : ""}
            {isOwn && (
              <span style={{
                marginLeft:    7,
                background:    "rgba(248,113,113,0.15)",
                color:         "#f87171",
                borderRadius:  3,
                padding:       "1px 5px",
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: "0.04em",
              }}>
                your song
              </span>
            )}
          </div>

          {isOwn ? (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              Can't rate your own song
            </div>
          ) : isRated ? (
            <div style={{gap: "5px"}}>
              <StarRating rating={myRating ? myRating.stars / 2 : dispStars} readOnly />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Rated ✓</div>
            </div>
          ) : (
            <div>
              <StarRating rating={dispStars} onRatingChange={setPendingStars} />
              {error && (
                <div style={{ fontSize: 10, color: "#f87171", marginTop: 2 }}>{error}</div>
              )}
              <button
                onClick={handleRate}
                disabled={!pendingStars}
                style={{
                  marginTop:    6,
                  padding:      "4px 14px",
                  background:   pendingStars ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.08)",
                  border:       "none",
                  borderRadius: 5,
                  cursor:       pendingStars ? "pointer" : "default",
                  fontSize:     11,
                  fontWeight:   700,
                  color:        pendingStars ? "#000" : "rgba(255,255,255,0.25)",
                  transition:   "background 0.15s",
                }}
              >
                Rate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared panel content ──────────────────────────────────────────────────────
// Used by both the desktop slide-out and the mobile full-page view.

function HistoryContent({ songs, participants, connected }) {
  const { partyId, participantId } = useParty();
  const [expandedId, setExpandedId] = useState(null);
  const count = songs.length;

  return (
    <>
      {/* Scoreboard at top — scores only, no status bar */}
      <Scoreboard songs={songs} participants={participants} connected={connected} inline section="scores" />

      {/* History header */}
      <div style={{
        flexShrink:   0,
        padding:      "10px 14px 9px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background:   "rgba(255,255,255,0.03)",
        display:      "flex",
        alignItems:   "center",
        gap:          8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily:    "sans-serif",
            fontSize:      11,
            fontWeight:    700,
            letterSpacing: "0.1em",
            color:         "rgba(255,255,255,0.6)",
          }}>
            HISTORY + VOTE
          </div>
          <div style={{
            fontFamily: "sans-serif",
            fontSize:   10,
            color:      "rgba(255,255,255,0.25)",
            marginTop:  1,
          }}>
            {count} {count === 1 ? "song" : "songs"} played — click to rate
          </div>
        </div>
        <Playlist songs={songs} />
      </div>

      {/* Song list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {count === 0 ? (
          <div style={{
            padding:    "24px 14px",
            fontFamily: "sans-serif",
            fontSize:   13,
            color:      "rgba(255,255,255,0.2)",
            textAlign:  "center",
          }}>
            Nothing played yet…
          </div>
        ) : (
          songs.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              number={i + 1}
              participantId={participantId}
              partyId={partyId}
              expanded={expandedId === song.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === song.id ? null : song.id))
              }
            />
          ))
        )}
      </div>
    </>
  );
}

// ── History — desktop: slide-out portal  /  mobile: full-page inline ──────────
// Props: open, onClose, songs, participants, connected, fullPage

export default function History({ open, onClose, songs = [], participants = [], connected = false, fullPage = false }) {
  // Mobile full-page: fills its container directly
  if (fullPage) {
    return (
      <div style={{
        position:      "absolute",
        inset:         0,
        display:       "flex",
        flexDirection: "column",
        background:    "#16161e",
        overflowY:     "hidden",
      }}>
        <HistoryContent songs={songs} participants={participants} connected={connected} />
      </div>
    );
  }

  // Desktop: portal slide-out from left
  return createPortal(
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 19, cursor: "default" }}
        />
      )}
      <div style={{
        position:      "fixed",
        top:           0,
        left:          0,
        width:         "min(360px, 88vw)",
        height:        "100vh",
        zIndex:        20,
        transform:     open ? "translateX(0)" : "translateX(-100%)",
        transition:    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display:       "flex",
        flexDirection: "column",
        background:    "#16161e",
        boxShadow:     "4px 0 28px rgba(0,0,0,0.7)",
      }}>
        <HistoryContent songs={songs} participants={participants} connected={connected} />
      </div>
    </>,
    document.body
  );
}
