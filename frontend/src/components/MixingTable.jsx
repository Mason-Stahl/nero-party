import { useState } from "react";
import { useParty } from "../context/PartyContext";
import Player from "./Player";

const API = "http://localhost:3000";

const SPIN_CSS = `
@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

// ── VinylSpinner ──────────────────────────────────────────────────────────────

function VinylSpinner({ song, label }) {
  const active = !!song;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 110 }}>
      <div style={{
        width: 110, height: 110,
        position: "relative",
        animation: active ? "vinyl-spin 4s linear infinite" : "none",
        flexShrink: 0,
      }}>
        <svg width="110" height="110" viewBox="0 0 110 110" style={{ display: "block" }}>
          {/* Vinyl body */}
          <circle cx="55" cy="55" r="54" fill="#0d0d0d" />
          <circle cx="55" cy="55" r="53" fill="none" stroke="#222" strokeWidth="0.5" />
          {/* Groove rings */}
          {[48, 43, 38, 33, 28, 23].map((r, i) => (
            <circle key={i} cx="55" cy="55" r={r} fill="none"
              stroke="rgba(255,255,255,0.045)" strokeWidth="1.5" />
          ))}
          {/* Center label disc */}
          <circle cx="55" cy="55" r="17" fill={active ? "rgb(120,80,255)" : "#1e1e1e"} />
          {active && (
            <circle cx="55" cy="55" r="17" fill="none"
              stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          )}
        </svg>

        {/* Thumbnail clipped to label area */}
        {song?.thumbnailUrl && (
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 32, height: 32,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            overflow: "hidden",
            pointerEvents: "none",
          }}>
            <img src={song.thumbnailUrl} alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Center hole */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 5, height: 5,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Label */}
      <div style={{ textAlign: "center", width: 110 }}>
        <div style={{
          fontSize: 7, fontWeight: 800, letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.3)", marginBottom: 3,
        }}>
          {label}
        </div>
        {song ? (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {song.title}
            </div>
            <div style={{
              fontSize: 8, color: "rgba(255,255,255,0.4)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {song.artist}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>—</div>
        )}
      </div>
    </div>
  );
}

// ── DrumPad ───────────────────────────────────────────────────────────────────

function DrumPad({ label, sublabel, toggled, isToggle = false, onClick, disabled = false, flash = false }) {
  const [pressing, setPressing] = useState(false);

  let ledColor, borderColor;
  if (isToggle) {
    ledColor    = toggled ? "#22c55e"              : "#f87171";
    borderColor = toggled ? "rgba(34,197,94,0.65)" : "rgba(248,113,113,0.55)";
  } else if (flash) {
    ledColor    = "#22c55e";
    borderColor = "rgba(34,197,94,0.5)";
  } else {
    ledColor    = pressing ? "#f59e0b"              : "rgba(255,255,255,0.18)";
    borderColor = pressing ? "rgba(245,158,11,0.55)" : "rgba(255,255,255,0.1)";
  }

  return (
    <div
      onMouseDown={() => !disabled && setPressing(true)}
      onMouseUp={() => { setPressing(false); if (!disabled) onClick?.(); }}
      onMouseLeave={() => setPressing(false)}
      title={label + (sublabel ? ` ${sublabel}` : "")}
      style={{
        width: 64, height: 64,
        background: pressing
          ? "linear-gradient(145deg, #3a3a3a, #202020)"
          : "linear-gradient(145deg, #2d2d2d, #181818)",
        border: `2px solid ${borderColor}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.32 : 1,
        position: "relative",
        boxShadow: pressing
          ? `inset 0 2px 8px rgba(0,0,0,0.95), 0 0 8px ${ledColor}44`
          : `0 3px 8px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "box-shadow 0.07s, background 0.07s",
        userSelect: "none",
        gap: 2,
      }}
    >
      {/* LED dot */}
      <div style={{
        position: "absolute", top: 5, right: 5,
        width: 5, height: 5,
        borderRadius: "50%",
        background: disabled ? "rgba(255,255,255,0.1)" : ledColor,
        boxShadow: disabled ? "none" : `0 0 6px ${ledColor}`,
        transition: "background 0.15s",
      }} />

      <div style={{
        fontSize: 8, fontWeight: 800, letterSpacing: "0.07em",
        color: "rgba(255,255,255,0.85)", textAlign: "center",
        lineHeight: 1.2, maxWidth: 52,
      }}>
        {label}
      </div>
      {sublabel && (
        <div style={{
          fontSize: 7, color: "rgba(255,255,255,0.38)",
          letterSpacing: "0.06em", textAlign: "center",
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ── RotaryDial ────────────────────────────────────────────────────────────────

function RotaryDial({ label, options, idx, onNext, onPrev }) {
  const count   = Math.max(options.length, 1);
  const current = options[idx % count] ?? { label: "—", value: null };
  const angle   = count > 1 ? (idx / (count - 1)) * 260 - 130 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      {/* Knob */}
      <div
        onClick={onNext}
        onContextMenu={(e) => { e.preventDefault(); onPrev?.(); }}
        title={`${label} — click / right-click`}
        style={{
          width: 56, height: 56,
          borderRadius: "50%",
          background: "radial-gradient(circle at 36% 30%, #3c3c3c, #1a1a1a)",
          border: "2px solid rgba(255,255,255,0.12)",
          position: "relative",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,255,255,0.06)",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        {/* Tick marks */}
        {[-130, -65, 0, 65, 130].map((a) => (
          <div key={a} style={{
            position: "absolute",
            bottom: "50%", left: "50%",
            width: 1.5, height: 6,
            background: "rgba(255,255,255,0.18)",
            transformOrigin: "50% 100%",
            transform: `translateX(-50%) rotate(${a}deg) translateY(-21px)`,
          }} />
        ))}

        {/* Pointer line — pivots around center, points upward at 0° */}
        <div style={{
          position: "absolute",
          bottom: "50%", left: "50%",
          width: 2, height: "44%",
          background: "rgba(255,255,255,0.88)",
          borderRadius: 2,
          transformOrigin: "50% 100%",
          transform: `translateX(-50%) rotate(${angle}deg)`,
          transition: "transform 0.2s ease",
        }} />

        {/* Center cap */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 10, height: 10,
          borderRadius: "50%",
          background: "#1e1e1e",
          border: "1px solid rgba(255,255,255,0.18)",
          transform: "translate(-50%, -50%)",
        }} />
      </div>

      <div style={{
        fontSize: 7, color: "rgba(255,255,255,0.35)",
        letterSpacing: "0.12em", textAlign: "center",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700,
        color: current.color ?? "rgba(255,255,255,0.75)",
        letterSpacing: "0.04em", textAlign: "center",
        maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {current.label}
      </div>
    </div>
  );
}

// ── MixingTable ───────────────────────────────────────────────────────────────

export default function MixingTable({ songs, participants, isPaused, effectiveStartTime }) {
  const { partyId, participantId, joinCode, groupName, autoAccept: initAutoAccept,
          maxSongLengthSec: initMaxLen } = useParty();

  const currentSong  = songs.find(s => s.status === "playing") ?? null;
  const nextSong     = songs.find(s => s.status === "queued")  ?? null;
  const pendingSongs = songs.filter(s => s.status === "pending");
  const pendingSong  = pendingSongs[0] ?? null;

  const [autoAccept, setAutoAccept] = useState(initAutoAccept);
  const [partIdx,    setPartIdx]    = useState(0);
  const [maxLenIdx,  setMaxLenIdx]  = useState(() => {
    const vals = [null, 60, 120, 180, 300, 600];
    const i = vals.indexOf(initMaxLen);
    return i < 0 ? 0 : i;
  });
  const [loading, setLoading] = useState({});
  const setLoad = (key, val) => setLoading(p => ({ ...p, [key]: val }));

  // Participant dial options (exclude self)
  const kickable    = participants.filter(p => p.id !== participantId);
  const partOptions = kickable.length > 0
    ? kickable.map(p => ({ label: p.displayName, value: p.id }))
    : [{ label: "—", value: null }];
  const selectedPart = partOptions[partIdx % partOptions.length];

  const maxLenOptions = [
    { label: "OFF",   value: null },
    { label: "1:00",  value: 60 },
    { label: "2:00",  value: 120 },
    { label: "3:00",  value: 180 },
    { label: "5:00",  value: 300 },
    { label: "10:00", value: 600 },
  ];

  // ── API helpers ──────────────────────────────────────────────────────────────
  const apiCall = async (method, url, extra, key) => {
    if (loading[key]) return;
    setLoad(key, true);
    try {
      await fetch(`${API}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId, ...extra }),
      });
    } finally {
      setLoad(key, false);
    }
  };

  // ── Action handlers ──────────────────────────────────────────────────────────
  const handleAdvance = () =>
    apiCall("POST", `/parties/${partyId}/songs/advance`, {}, "advance");

  const handleApprove = () => {
    if (!pendingSong) return;
    apiCall("POST", `/parties/${partyId}/songs/${pendingSong.id}/approve`, {}, "approve");
  };

  const handleReject = () => {
    if (!pendingSong) return;
    apiCall("POST", `/parties/${partyId}/songs/${pendingSong.id}/reject`, {}, "reject");
  };

  const handleBanSong = () => {
    if (!currentSong) return;
    apiCall("DELETE", `/parties/${partyId}/songs/${currentSong.id}`, {}, "ban");
  };

  const handleKick = () => {
    if (!selectedPart.value) return;
    apiCall("DELETE", `/parties/${partyId}/participants/${selectedPart.value}`, {}, "kick");
    setPartIdx(0);
  };

  const handlePauseResume = () => {
    const route = isPaused ? "resume" : "pause";
    apiCall("POST", `/parties/${partyId}/songs/${route}`, {}, "pauseResume");
  };

  const handleToggleAutoAccept = async () => {
    const next = !autoAccept;
    setAutoAccept(next);
    apiCall("PATCH", `/parties/${partyId}`, { autoAccept: next }, "autoAccept");
  };

  const handleMaxLenNext = () => {
    const next = (maxLenIdx + 1) % maxLenOptions.length;
    setMaxLenIdx(next);
    apiCall("PATCH", `/parties/${partyId}`, { maxSongLengthSec: maxLenOptions[next].value }, "maxLen");
  };

  const handleMaxLenPrev = () => {
    const prev = (maxLenIdx - 1 + maxLenOptions.length) % maxLenOptions.length;
    setMaxLenIdx(prev);
    apiCall("PATCH", `/parties/${partyId}`, { maxSongLengthSec: maxLenOptions[prev].value }, "maxLen");
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: "linear-gradient(180deg, #1e1e1e 0%, #111 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 8px 40px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)",
      width: "100%",
    }}>
      <style>{SPIN_CSS}</style>

      {/* ── Header ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 16px",
        background: "rgba(0,0,0,0.45)",
        borderBottom: "1px solid rgba(255,255,255,0.055)",
      }}>
        <div style={{
          fontSize: 8, fontWeight: 800, letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.35)",
        }}>
          NERO // MIXING TABLE
        </div>
        <div style={{ fontSize: 8, letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)" }}>
          {groupName?.toUpperCase()} · {joinCode}
        </div>
      </div>

      {/* ── Vinyl + Player + Vinyl ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px 10px",
      }}>
        <VinylSpinner song={currentSong} label="NOW PLAYING" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <Player
            song={currentSong}
            isPaused={isPaused}
            effectiveStartTime={effectiveStartTime}
          />
        </div>

        <VinylSpinner song={nextSong} label="UP NEXT" />
      </div>

      {/* ── Divider ── */}
      <div style={{
        height: 1,
        margin: "0 18px",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)",
      }} />

      {/* ── Controls: pads + pending info + dials ── */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "12px 18px 14px",
      }}>

        {/* Pad grid — 2 rows × 4 pads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
          {/* Row 1 */}
          <div style={{ display: "flex", gap: 6 }}>
            <DrumPad
              label="AUTO" sublabel="ACCEPT"
              isToggle toggled={autoAccept}
              onClick={handleToggleAutoAccept}
              disabled={!!loading.autoAccept}
            />
            <DrumPad
              label="APPROVE" sublabel="SONG"
              onClick={handleApprove}
              disabled={!pendingSong || !!loading.approve}
              flash={pendingSongs.length > 0}
            />
            <DrumPad
              label="REJECT" sublabel="SONG"
              onClick={handleReject}
              disabled={!pendingSong || !!loading.reject}
            />
            <DrumPad
              label="▶ NEXT"
              onClick={handleAdvance}
              disabled={!!loading.advance}
              flash={!!nextSong}
            />
          </div>
          {/* Row 2 */}
          <div style={{ display: "flex", gap: 6 }}>
            <DrumPad
              label="BAN" sublabel="SONG"
              onClick={handleBanSong}
              disabled={!currentSong || !!loading.ban}
            />
            <DrumPad
              label="KICK" sublabel="USER"
              onClick={handleKick}
              disabled={!selectedPart.value || !!loading.kick}
            />
            <DrumPad
              label={isPaused ? "▶ PLAY" : "⏸ PAUSE"}
              isToggle toggled={isPaused}
              onClick={handlePauseResume}
              disabled={!currentSong || !!loading.pauseResume}
            />
            {/* Decorative filler pad */}
            <DrumPad label="" disabled />
          </div>
        </div>

        {/* Pending song info */}
        <div style={{
          flex: 1, minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignSelf: "center",
          padding: "0 4px",
        }}>
          {pendingSong ? (
            <div style={{
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.22)",
              borderRadius: 8,
              padding: "8px 10px",
            }}>
              <div style={{
                fontSize: 7, fontWeight: 800, letterSpacing: "0.14em",
                color: "#f59e0b", marginBottom: 4,
              }}>
                PENDING · {pendingSongs.length} SONG{pendingSongs.length !== 1 ? "S" : ""}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {pendingSong.title}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>
                {pendingSong.artist}
              </div>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "10px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 7, letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)" }}>
                NO PENDING SONGS
              </div>
            </div>
          )}
        </div>

        {/* Dials */}
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexShrink: 0 }}>
          <RotaryDial
            label="PARTICIPANT"
            options={partOptions}
            idx={partIdx % partOptions.length}
            onNext={() => setPartIdx(i => (i + 1) % partOptions.length)}
            onPrev={() => setPartIdx(i => (i - 1 + partOptions.length) % partOptions.length)}
          />
          <RotaryDial
            label="MAX LENGTH"
            options={maxLenOptions}
            idx={maxLenIdx}
            onNext={handleMaxLenNext}
            onPrev={handleMaxLenPrev}
          />
        </div>
      </div>
    </div>
  );
}
