import { useState } from "react";
import { useParty } from "../../context/PartyContext";
import SlideDrawer from "./SlideDrawer";
import StarRating from "./StarRating";
import Playlist from "./Playlist";

// ── constants ─────────────────────────────────────────────────────────────────

const CREAM    = "#fdf8e1";
const LINE_CLR = "#b8cfe8";
const RED_LINE = "#c85050";
const LINE_H   = 28;
const MARGIN_W = 30;

const RULED_BG = `repeating-linear-gradient(
  transparent,
  transparent ${LINE_H - 1}px,
  ${LINE_CLR} ${LINE_H - 1}px,
  ${LINE_CLR} ${LINE_H}px
)`;

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

  const isOwn     = song.addedByParticipantId === participantId;
  const myRating  = song.ratings?.find((r) => r.participantId === participantId);
  const avg       = avgDisplay(song.ratings);
  const isRated   = submitted || !!myRating;
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
    <div>
      {/* song row */}
      <div
        onClick={onToggle}
        style={{
          display:    "flex",
          alignItems: "center",
          height:     LINE_H,
          cursor:     "pointer",
        }}
      >
        <div style={{
          width:        MARGIN_W,
          flexShrink:   0,
          textAlign:    "right",
          paddingRight: 8,
          fontSize:     10,
          fontFamily:   "sans-serif",
          color:        "rgba(0,0,0,0.3)",
        }}>
          {number}
        </div>
        <div style={{ width: 10, flexShrink: 0 }} />
        <span style={{
          flex:         1,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          fontFamily:   "'Caveat', 'Comic Sans MS', cursive",
          fontSize:     16,
          color:        "#1a1a1a",
        }}>
          {song.title}
        </span>
        {avg !== null && (
          <span style={{
            fontSize:    10,
            fontFamily:  "sans-serif",
            color:       "#888",
            flexShrink:  0,
            marginRight: 8,
          }}>
            ★{avg}
          </span>
        )}
      </div>

      {/* RatingBox */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            marginLeft:   MARGIN_W + 10,
            marginTop:    4,
            marginBottom: 6,
            marginRight:  8,
            background:   "rgba(255,255,255,0.88)",
            border:       "1px solid rgba(0,0,0,0.1)",
            borderRadius: 5,
            padding:      "7px 10px",
            fontFamily:   "sans-serif",
          }}
        >
          <div style={{ fontSize: 11, color: "#777", marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{song.artist}</span>
            {song.durationSec ? ` · ${formatDuration(song.durationSec)}` : ""}
            {isOwn && (
              <span style={{
                marginLeft:    7,
                background:    "#fde8e8",
                color:         "#c0392b",
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
            <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>
              Can't rate your own song
            </div>
          ) : isRated ? (
            <div>
              <StarRating rating={myRating ? myRating.stars / 2 : dispStars} readOnly />
              <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>Rated ✓</div>
            </div>
          ) : (
            <div>
              <StarRating rating={dispStars} onRatingChange={setPendingStars} />
              {error && (
                <div style={{ fontSize: 10, color: "#c0392b", marginTop: 2 }}>{error}</div>
              )}
              <button
                onClick={handleRate}
                disabled={!pendingStars}
                style={{
                  marginTop:    5,
                  padding:      "3px 12px",
                  background:   pendingStars ? "#1db954" : "#ddd",
                  border:       "none",
                  borderRadius: 4,
                  cursor:       pendingStars ? "pointer" : "default",
                  fontSize:     11,
                  fontWeight:   700,
                  color:        pendingStars ? "#fff" : "#999",
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

// ── History ───────────────────────────────────────────────────────────────────

export default function History({ songs = [] }) {
  const { partyId, participantId, isHost } = useParty();
  const [expandedId, setExpandedId] = useState(null);

  const count = songs.length;

  return (
    <SlideDrawer
      side="left"
      tabTop={isHost ? "10%" : "50%"}
      tabYOffset={isHost ? "0" : "-50%"}
      tabLabel="HISTORY + VOTE"
      tabSubtext={`${count} ${count === 1 ? "song" : "songs"} played`}
    >
      {/* panel header */}
      <div style={{
        padding:      "12px 14px 10px",
        borderBottom: `1px solid ${LINE_CLR}`,
        flexShrink:   0,
        background:   CREAM,
        display:      "flex",
        alignItems:   "center",
        gap:          8,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily:    "sans-serif",
            fontSize:      12,
            fontWeight:    700,
            letterSpacing: "0.1em",
            color:         "#333",
          }}>
            HISTORY
          </div>
          <div style={{
            fontFamily: "sans-serif",
            fontSize:   10,
            color:      "rgba(0,0,0,0.4)",
            marginTop:  2,
          }}>
            {count} {count === 1 ? "song" : "songs"} played — click to rate
          </div>
        </div>
        <Playlist songs={songs} />
      </div>

      {/* song list */}
      <div style={{
        flex:            1,
        overflowY:       "auto",
        position:        "relative",
        background:      CREAM,
        backgroundImage: RULED_BG,
      }}>
        {/* red margin line */}
        <div style={{
          position:      "absolute",
          left:          MARGIN_W,
          top:           0,
          bottom:        0,
          width:         1,
          background:    RED_LINE,
          opacity:       0.55,
          pointerEvents: "none",
          zIndex:        1,
        }} />

        {count === 0 ? (
          <div style={{
            padding:    "2px 40px",
            fontFamily: "'Caveat', 'Comic Sans MS', cursive",
            fontSize:   15,
            color:      "rgba(0,0,0,0.3)",
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
    </SlideDrawer>
  );
}
