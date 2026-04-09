import { useState } from "react";
import { useParty } from "../../context/PartyContext";
import Queue            from "../Queue";
import PlaybackControls from "../PlaybackControls";

const API = "http://localhost:3000";

export default function MiddleZone({
  isHost,
  songs,
  history,
  isPaused,
  effectiveStartTime,
  autoAccept,
}) {
  const { partyId, participantId } = useParty();
  const [loading,     setLoading]     = useState({});
  const [focusedSong, setFocusedSong] = useState(null);

  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const currentSong = songs.find((s) => s.status === "playing") ?? null;

  const apiCall = async (method, url, extra = {}, key) => {
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

  const handlePauseResume = () =>
    apiCall("POST", `/parties/${partyId}/songs/${isPaused ? "resume" : "pause"}`, {}, "pauseResume");

  const handleAdvance  = () => apiCall("POST", `/parties/${partyId}/songs/advance`, {}, "advance");
  const handleRewind   = () => apiCall("POST", `/parties/${partyId}/songs/rewind`,  {}, "rewind");
  const handleSkipTo   = (targetSongId) => apiCall("POST", `/parties/${partyId}/songs/advance`, { targetSongId }, "advance");
  const handleRewindTo = (targetSongId) => apiCall("POST", `/parties/${partyId}/songs/rewind`,  { targetSongId }, "rewind");

  const handleApprove = () => {
    const p = songs.find((s) => s.status === "pending");
    if (p) apiCall("POST", `/parties/${partyId}/songs/${p.id}/approve`, {}, "approve");
  };
  const handleReject = () => {
    const p = songs.find((s) => s.status === "pending");
    if (p) apiCall("POST", `/parties/${partyId}/songs/${p.id}/reject`, {}, "reject");
  };

  // ── Non-host: full carousel, no controls ──────────────────────────────────
  if (!isHost) {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <Queue
          songs={songs}
          history={history}
          isPaused={isPaused}
          effectiveStartTime={effectiveStartTime}
        />
      </div>
    );
  }

  // ── Host: carousel + context-aware controls ───────────────────────────────
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* Carousel fills space above controls */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 76 }}>
        <Queue
          songs={songs}
          history={history}
          isPaused={isPaused}
          effectiveStartTime={effectiveStartTime}
          onFocusedChange={setFocusedSong}
        />
      </div>

      {/* Context-aware playback controls */}
      <div style={{
        position:    "absolute",
        bottom:      0, left: 0, right: 0,
        height:      76,
        display:     "flex",
        alignItems:  "center",
      }}>
        <PlaybackControls
          isHost={isHost}
          focusedSong={focusedSong}
          currentSong={currentSong}
          history={history}
          songs={songs}
          isPaused={isPaused}
          autoAccept={autoAccept}
          loading={loading}
          onPauseResume={handlePauseResume}
          onAdvance={handleAdvance}
          onRewind={handleRewind}
          onApprove={handleApprove}
          onReject={handleReject}
          onSkipTo={handleSkipTo}
          onRewindTo={handleRewindTo}
        />
      </div>
    </div>
  );
}
