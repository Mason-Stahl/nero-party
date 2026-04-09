// Scoreboard — TV screen at top of stage.
// Rows = participants, scored by avg rating across all their played songs (0 until rated).
//
// section prop:
//   "all"    (default) — status bar + chart
//   "status" — only the top status bar (joinCode replaced with "connected: N")
//   "scores" — only the chart (header + rows)

import { useParty } from "../context/PartyContext";

const GOLD   = "#f5c518";
const SILVER = "#b0b0b0";
const GREEN  = "#1db954";
const DIM    = "rgba(255,255,255,0.18)";
const BAR_BG = "rgba(255,255,255,0.08)";

function ParticipantRow({ name, avg, rank, maxAvg, hasScores }) {
  const isFirst = rank === 1 && hasScores;
  const pct     = maxAvg > 0 && avg > 0 ? (avg / maxAvg) * 100 : 0;

  const barColor = isFirst
    ? `linear-gradient(90deg, ${GOLD}cc, ${GOLD}44)`
    : `linear-gradient(90deg, ${GREEN}99, ${GREEN}33)`;

  const rankColor = isFirst ? GOLD : rank === 2 && hasScores ? SILVER : DIM;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
      <span style={{
        width: 18, flexShrink: 0, textAlign: "right",
        fontFamily: "monospace", fontSize: 11,
        color: rankColor, fontWeight: isFirst ? 700 : 400,
      }}>
        {rank}.
      </span>

      <span style={{
        width: 120, flexShrink: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "sans-serif", fontSize: 11,
        color: isFirst ? GOLD : "rgba(255,255,255,0.85)",
        fontWeight: isFirst ? 700 : 400,
      }}>
        {name}
      </span>

      <div style={{
        flex: 1, height: 10, background: BAR_BG,
        borderRadius: 3, overflow: "hidden", position: "relative",
      }}>
        {avg > 0 && (
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0,
            width: `${pct}%`, background: barColor,
            borderRadius: 3, transition: "width 0.6s ease",
          }} />
        )}
      </div>

      <span style={{
        width: 36, flexShrink: 0, textAlign: "right",
        fontFamily: "monospace", fontSize: 11,
        color: avg > 0 ? (isFirst ? GOLD : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.2)",
        fontWeight: isFirst ? 700 : 400,
      }}>
        {avg > 0 ? `${avg.toFixed(1)}★` : "–"}
      </span>
    </div>
  );
}

export default function Scoreboard({
  songs = [],
  participants = [],
  connected = false,
  onLeave,
  inline = false,
  section = "all",
}) {
  const { groupName, participantId } = useParty();
  const displayName = participants.find((p) => p.id === participantId)?.displayName ?? "";

  const showStatus = section === "all" || section === "status";
  const showScores = section === "all" || section === "scores";

  // Per-participant avg across all their played+rated songs
  const rows = participants.map((p) => {
    const theirSongs  = songs.filter((s) => s.addedByParticipantId === p.id);
    const allRatings  = theirSongs.flatMap((s) => s.ratings ?? []);
    const avg         = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length / 2
      : 0;
    return { id: p.id, name: p.displayName, avg };
  }).sort((a, b) => b.avg - a.avg);

  const anyScored = rows.some((r) => r.avg > 0);
  const maxAvg    = anyScored ? rows[0].avg : 5;

  const outerStyle = inline ? {
    width:          "100%",
    background:     "rgba(0,0,0,0.32)",
    backdropFilter: "blur(10px)",
    border:         "none",
    borderBottom:   "1px solid rgba(255,255,255,0.08)",
    borderRadius:   0,
    padding:        "12px 14px 14px",
  } : {
    position:       "absolute",
    top:            12,
    left:           "50%",
    transform:      "translateX(-50%)",
    width:          "min(520px, 80vw)",
    background:     "rgba(0,0,0,0.72)",
    backdropFilter: "blur(10px)",
    border:         "1px solid rgba(255,255,255,0.12)",
    borderRadius:   10,
    padding:        "10px 14px 12px",
    zIndex:         10,
    boxShadow:      "0 4px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
  };

  return (
    <div style={outerStyle}>

      {/* ── top bar: group name + connection status ── */}
      {showStatus && (
        <div style={{
          display: "flex", alignItems: "center",
          marginBottom: showScores ? 8 : 0,
          paddingBottom: showScores ? 7 : 0,
          borderBottom: showScores ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}>
          <span style={{
            fontFamily: "sans-serif", fontSize: 11,
            fontWeight: 700, letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.5)",
          }}>
            {displayName} · {groupName?.toUpperCase()} · connected: {participants.length}
          </span>
          <span style={{
            marginLeft: "auto", fontFamily: "sans-serif", fontSize: 11,
            color: connected ? "rgb(34,197,94)" : "#f87171",
          }}>
            {connected ? "● live" : "○ connecting…"}
          </span>
          {!inline && (
            <button
              onClick={onLeave ?? (() => window.location.reload())}
              style={{
                marginLeft:    10,
                padding:       "2px 8px",
                background:    "rgba(255,255,255,0.07)",
                border:        "1px solid rgba(255,255,255,0.15)",
                borderRadius:  4,
                cursor:        "pointer",
                fontFamily:    "sans-serif",
                fontSize:      9,
                fontWeight:    700,
                letterSpacing: "0.06em",
                color:         "rgba(255,255,255,0.45)",
                transition:    "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.18)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
            >
              LEAVE
            </button>
          )}
        </div>
      )}

      {/* ── scoreboard chart ── */}
      {showScores && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>🏆</span>
            <span style={{
              fontFamily: "sans-serif", fontSize: 10,
              fontWeight: 700, letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.35)",
            }}>
              SCOREBOARD
            </span>
            {anyScored && (
              <span style={{
                marginLeft: "auto", fontFamily: "sans-serif", fontSize: 10,
                color: GOLD, fontWeight: 700, letterSpacing: "0.05em",
              }}>
                WINNER: {rows[0].name}
              </span>
            )}
          </div>

          {!anyScored && (
            <div style={{
              fontFamily: "sans-serif", fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginBottom: 6,
            }}>
              No scores yet — rate played songs in History
            </div>
          )}

          {rows.map((row, i) => (
            <ParticipantRow
              key={row.id}
              name={row.name}
              avg={row.avg}
              rank={i + 1}
              maxAvg={maxAvg}
              hasScores={anyScored}
            />
          ))}
        </>
      )}
    </div>
  );
}
