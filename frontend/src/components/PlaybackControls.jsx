// ── Context-aware playback controls ───────────────────────────────────────────
// States: past song focused → REWIND TO | now-playing focused → full controls | future song focused → SKIP TO

import CircleBtn from "./CircleBtn";

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
  onSkipTo,       // (songId) → skip queue to this specific future song
  onRewindTo,     // (songId) → rewind queue to this specific past song
}) {
  if (!isHost) return null;

  const status = focusedSong?.status;

  // ── Future song focused → SKIP TO ─────────────────────────────────────────
  if (status === "queued" || status === "pending") {
    return (
      <div style={ROW}>
        <CircleBtn
          onClick={() => onSkipTo(focusedSong.id)}
          label="SKIP TO"
          disabled={!!loading.advance}
        >
          <IconNext />
        </CircleBtn>
      </div>
    );
  }

  // ── Past song focused → REWIND TO ─────────────────────────────────────────
  if (status === "played") {
    return (
      <div style={ROW}>
        <CircleBtn
          onClick={() => onRewindTo(focusedSong.id)}
          label="REWIND TO"
          disabled={!!loading.rewind}
        >
          <IconRewind />
        </CircleBtn>
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

      {!autoAccept && (
        <CircleBtn
          onClick={onReject}
          label="REJECT"
          disabled={!pendingSong || !!loading.reject}
        >
          <IconX />
        </CircleBtn>
      )}
    </div>
  );
}
