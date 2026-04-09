// ── Context-aware playback controls ───────────────────────────────────────────
// States: past song focused → REWIND TO | now-playing focused → full controls | future song focused → SKIP TO

import { useState, useEffect } from "react";
import { useParty } from "../context/PartyContext";
import CircleBtn  from "./CircleBtn";
import StarRating from "./Peripherals/StarRating";
import GlassPanel  from "./GlassPanel";
import Btn        from "./Btn";

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconRewind = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
  </svg>
);
const IconPlay = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IconPause = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);
const IconNext = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IconPlayNext = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M6 18l8.5-6L6 6v12z" opacity=".5"/>
    <path d="M13 6v12l8.5-6L13 6z"/>
    <rect x="2.5" y="11" width="5" height="2" rx="1"/>
  </svg>
);
const IconPlayNow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z"/>
    <rect x="3" y="5" width="2" height="14" rx="1"/>
  </svg>
);

// ── VoteButton ────────────────────────────────────────────────────────────────

function VoteButton({ focusedSong }) {
  const { partyId, participantId } = useParty();
  const [open,         setOpen]         = useState(false);
  const [pendingStars, setPendingStars] = useState(0);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState(null);

  // Reset state when focused song changes
  useEffect(() => {
    setOpen(false);
    setPendingStars(0);
    setSubmitted(false);
    setError(null);
  }, [focusedSong?.id]);

  const canRate = focusedSong &&
    (focusedSong.status === "playing" || focusedSong.status === "played");
  const isOwn    = focusedSong?.addedByParticipantId === participantId;
  const myRating = focusedSong?.ratings?.find((r) => r.participantId === participantId);
  const isRated  = submitted || !!myRating;
  const dispStars = pendingStars || (myRating ? myRating.stars / 2 : 0);

  const handleSubmit = async () => {
    if (!pendingStars || !focusedSong) return;
    try {
      const res = await fetch(
        `http://localhost:3000/parties/${partyId}/songs/${focusedSong.id}/rate`,
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
      setTimeout(() => setOpen(false), 700);
    } catch {
      setError("Network error");
    }
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
      {/* Callout — appears above the button */}
      {open && canRate && (
        <GlassPanel style={{
          position:  "absolute",
          bottom:    "calc(100% + 10px)",
          left:      "50%",
          transform: "translateX(-50%)",
          padding:   "14px 16px",
          minWidth:  190,
          zIndex:    50,
        }}>
          {isOwn ? (
            <div style={{
              fontSize:   11,
              color:      "rgba(255,255,255,0.4)",
              fontStyle:  "italic",
              textAlign:  "center",
              fontFamily: "sans-serif",
            }}>
              Can't rate your own song
            </div>
          ) : isRated ? (
            <div style={{ textAlign: "center" }}>
              <StarRating rating={myRating ? myRating.stars / 2 : dispStars} readOnly />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, fontFamily: "sans-serif" }}>
                Rated ✓
              </div>
            </div>
          ) : (
            <div>
              <StarRating rating={dispStars} onRatingChange={setPendingStars} />
              {error && (
                <div style={{ fontSize: 10, color: "#f87171", marginTop: 2, fontFamily: "sans-serif" }}>
                  {error}
                </div>
              )}
              <Btn
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleSubmit}
                disabled={!pendingStars}
                style={{ marginTop: 8 }}
              >
                Submit
              </Btn>
            </div>
          )}
        </GlassPanel>
      )}

      <CircleBtn
        onClick={() => canRate && setOpen((o) => !o)}
        label="VOTE"
        disabled={!canRate}
      >
        <IconStar />
      </CircleBtn>
    </div>
  );
}

// ── PlaybackControls ──────────────────────────────────────────────────────────

const ROW = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  gap:            20,
  width:          "100%",
  padding:        "0 18px",
};

export default function PlaybackControls({
  isHost,
  focusedSong,    // song currently previewed in carousel
  currentSong,    // the now-playing song (status === "playing")
  history,        // played songs array
  songs,          // active songs array (queued + playing + pending)
  isPaused,
  autoAccept,
  loading,
  onPauseResume,
  onAdvance,
  onRewind,
  onApprove,
  onReject,
  onQueueNext,    // (songId) → insert song as next-up without advancing
  onPlayNow,      // (songId) → insert song as next-up AND advance immediately
}) {
  // ── Non-host: vote button only ────────────────────────────────────────────
  if (!isHost) {
    return (
      <div style={ROW}>
        <VoteButton focusedSong={focusedSong} />
      </div>
    );
  }

  const status = focusedSong?.status;

  // ── Pending song focused (manual mode) → APPROVE / REJECT ───────────────
  if (status === "pending") {
    return (
      <div style={ROW}>
        <CircleBtn
          onClick={() => onApprove(focusedSong.id)}
          label="APPROVE"
          disabled={!!loading.approve}
        >
          <IconCheck />
        </CircleBtn>
        <CircleBtn
          onClick={() => onReject(focusedSong.id)}
          label="REJECT"
          disabled={!!loading.reject}
        >
          <IconX />
        </CircleBtn>
        <VoteButton focusedSong={focusedSong} />
      </div>
    );
  }

  // ── Queued or played song focused → PLAY NEXT / PLAY NOW ────────────────
  if (status === "queued" || status === "played") {
    return (
      <div style={ROW}>
        <CircleBtn
          onClick={() => onPlayNow(focusedSong.id)}
          label="PLAY NOW"
          disabled={!!loading.playNow}
        >
          <IconPlayNow />
        </CircleBtn>
        <CircleBtn
          onClick={() => onQueueNext(focusedSong.id)}
          label="PLAY NEXT"
          disabled={!!loading.queueNext}
        >
          <IconPlayNext />
        </CircleBtn>
        <VoteButton focusedSong={focusedSong} />
      </div>
    );
  }

  // ── Now-playing (or no song yet) → full controls ───────────────────────────
  const nextSong     = songs.find((s) => s.status === "queued")   ?? null;
  const pendingSongs = songs.filter((s) => s.status === "pending");
  const pendingSong  = pendingSongs[0] ?? null;

  return (
    <div style={ROW}>
      {!autoAccept && (
        <CircleBtn
          onClick={onApprove}
          label="APPROVE"
          disabled={!pendingSong || !!loading.approve}
          badge={pendingSongs.length}
        >
          <IconCheck />
        </CircleBtn>
      )}

      {!autoAccept && (
        <CircleBtn
          onClick={onReject}
          label="REJECT"
          disabled={!pendingSong || !!loading.reject}
        >
          <IconX />
        </CircleBtn>
      )}

      <CircleBtn
        onClick={onRewind}
        label="REWIND"
        disabled={history.length === 0 || !!loading.rewind}
      >
        <IconRewind />
      </CircleBtn>

      <CircleBtn
        onClick={onPauseResume}
        label={isPaused ? "PLAY" : "PAUSE"}
        disabled={!currentSong || !!loading.pauseResume}
      >
        {isPaused ? <IconPlay /> : <IconPause />}
      </CircleBtn>

      <CircleBtn
        onClick={onAdvance}
        label="NEXT"
        disabled={!nextSong || !!loading.advance}
      >
        <IconNext />
      </CircleBtn>

      <VoteButton focusedSong={focusedSong} />
    </div>
  );
}
