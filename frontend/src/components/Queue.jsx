// ── Carousel of all songs (history ← now playing → upcoming) ──────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import QueueCard from "./QueueCard";

const SPIN_CSS = `
@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}`;

// ── Responsive card size ──────────────────────────────────────────────────────
function calcCardSize() {
  const byHeight = window.innerHeight * 0.36;
  const byWidth  = window.innerWidth  * 0.64;
  return Math.min(400, byHeight, byWidth);
}

function useCardSize() {
  const [size, setSize] = useState(calcCardSize);
  useEffect(() => {
    const onResize = () => setSize(calcCardSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

// Now-playing card is scaled up; side cards are pushed out by the same delta
// so the overlap between center and offset-1 cards stays visually consistent.
const NOW_SCALE  = 1.3;  // now-playing card is 30% wider than vinyl cards
const TOP_OFFSET = 17;   // shift all cards down to center below nav buttons

// extraPush is (nowCardSize - cardSize) / 2 — added to every non-center tx
function offsetProps(offset, cardSize, extraPush = 0) {
  const abs  = Math.abs(offset);
  const sign = offset >= 0 ? 1 : -1;
  if (abs === 0) return { tx: 0,                                              scale: 1,    zIndex: 10, opacity: 1    };
  if (abs === 1) return { tx: sign * (Math.round(cardSize * 0.65) + extraPush), scale: 0.72, zIndex: 8,  opacity: 0.85 };
  if (abs === 2) return { tx: sign * (Math.round(cardSize * 1.04) + extraPush), scale: 0.55, zIndex: 6,  opacity: 0.70 };
  if (abs === 3) return { tx: sign * (Math.round(cardSize * 1.36) + extraPush), scale: 0.42, zIndex: 4,  opacity: 0.54 };
  if (abs === 4) return { tx: sign * (Math.round(cardSize * 1.62) + extraPush), scale: 0.32, zIndex: 2,  opacity: 0.38 };
  if (abs === 5) return { tx: sign * (Math.round(cardSize * 1.82) + extraPush), scale: 0.24, zIndex: 1,  opacity: 0.22 };
  return null;
}

// ── Nav buttons — CircleBtn-style hover ───────────────────────────────────────
function NavCircleBtn({ onClick, disabled, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        width: 34, height: 34, borderRadius: "50%",
        background: disabled
          ? "rgba(255,255,255,0.03)"
          : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "rgba(255,255,255,0.2)" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.15s",
        opacity: disabled ? 0.35 : 1,
        flexShrink: 0,
        fontSize: 20,
      }}
    >
      {children}
    </button>
  );
}

function JumpBtn({ onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        background: disabled
          ? "rgba(255,255,255,0.03)"
          : hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 20,
        height: 34,
        padding: "0 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.85)",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        whiteSpace: "nowrap",
        display: "flex", alignItems: "center",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.15s",
      }}
    >
      JUMP TO PRESENT
    </button>
  );
}

// ── Queue ─────────────────────────────────────────────────────────────────────
export default function Queue({
  songs              = [],
  history            = [],
  isPaused           = false,
  effectiveStartTime = null,
  onFocusedChange    = null,  // (song | null) → called when the focused card changes
}) {
  const containerRef = useRef(null);
  const lastWheelRef = useRef(0);
  const cardSize     = useCardSize();

  // Always: history (oldest→newest) | playing | queued (next-up first)
  const played  = history
    .slice()
    .sort((a, b) => new Date(a.startedAt ?? a.createdAt) - new Date(b.startedAt ?? b.createdAt));
  const playing = songs.find((s) => s.status === "playing") ?? null;
  const queued  = songs
    .filter((s) => s.status === "queued" || s.status === "pending")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const allSongs = [...played, ...(playing ? [playing] : []), ...queued];
  const nowIdx   = playing ? played.length : -1;

  // Track focused song by ID so the position stays stable when allSongs reorders
  // (new songs added, song advances, etc.)
  const [focusedId, setFocusedId] = useState(() => playing?.id ?? null);
  const prevPlayingId              = useRef(playing?.id ?? null);

  // Derived index: find focused song by ID in current allSongs array
  const focusedIdx = (() => {
    if (!focusedId) return Math.max(0, nowIdx);
    const idx = allSongs.findIndex((s) => s.id === focusedId);
    return idx >= 0 ? idx : Math.max(0, nowIdx);
  })();

  // Auto-follow now-playing only when the user was already at the now-playing card
  useEffect(() => {
    if (!playing) return;
    const userWasAtNow = !focusedId || focusedId === prevPlayingId.current;
    if (userWasAtNow) setFocusedId(playing.id);
    prevPlayingId.current = playing.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing?.id]);

  // Notify parent whenever the focused song changes
  const focusedSong = allSongs[focusedIdx] ?? null;
  const prevFocusedId = useRef(focusedSong?.id);
  useEffect(() => {
    if (focusedSong?.id !== prevFocusedId.current) {
      prevFocusedId.current = focusedSong?.id;
      onFocusedChange?.(focusedSong);
    }
  });

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelRef.current < 380) return;
    lastWheelRef.current = now;
    setFocusedId((id) => {
      const cur  = id ? allSongs.findIndex((s) => s.id === id) : Math.max(0, nowIdx);
      const next = Math.max(0, Math.min(allSongs.length - 1, cur + (e.deltaY > 0 ? 1 : -1)));
      return allSongs[next]?.id ?? id;
    });
  }, [allSongs, nowIdx]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (allSongs.length === 0) return null;

  const atStart = focusedIdx <= 0;
  const atEnd   = focusedIdx >= allSongs.length - 1;
  const atNow   = nowIdx < 0 || focusedIdx === nowIdx;

  const moveTo = (idx) => setFocusedId(allSongs[Math.max(0, Math.min(allSongs.length - 1, idx))]?.id ?? null);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <style>{SPIN_CSS}</style>

      {/* HISTORY label — top-left */}
      <div style={{
        position: "absolute", top: 0, left: "6%", height: 34,
        display: "flex", alignItems: "center",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.2)", userSelect: "none", zIndex: 20,
      }}>
        HISTORY
      </div>

      {/* UPCOMING label — top-right */}
      <div style={{
        position: "absolute", top: 0, right: "6%", height: 34,
        display: "flex", alignItems: "center",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.2)", userSelect: "none", zIndex: 20,
      }}>
        UPCOMING
      </div>

      {/* Nav buttons — centered at top */}
      <div style={{
        position: "absolute",
        top: 0, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 8,
        zIndex: 20,
      }}>
        <NavCircleBtn onClick={() => moveTo(focusedIdx - 1)} disabled={atStart}>‹</NavCircleBtn>
        <JumpBtn onClick={() => nowIdx >= 0 && setFocusedId(playing.id)} disabled={atNow} />
        <NavCircleBtn onClick={() => moveTo(focusedIdx + 1)} disabled={atEnd}>›</NavCircleBtn>
      </div>

      {/* Card stack */}
      {(() => {
        const nowCardSize = Math.round(cardSize * NOW_SCALE);
        const extraPush   = (nowCardSize - cardSize) / 2;

        return allSongs.map((song, i) => {
          const offset       = i - focusedIdx;
          const isNowPlaying = song.status === "playing";
          let   props        = offsetProps(offset, cardSize, extraPush);

          // Always keep the now-playing card mounted so the iframe stays alive
          if (!props && isNowPlaying) {
            const sign = offset > 0 ? 1 : -1;
            props = { tx: sign * Math.round(cardSize * 2.5), scale: 0.14, zIndex: 0, opacity: 0 };
          }
          if (!props) return null;

          const { tx, scale, zIndex, opacity } = props;
          const isFocused    = offset === 0;
          const thisCardSize = isNowPlaying ? nowCardSize : cardSize;

          return (
            <div
              key={song.id}
              onClick={() => { if (!isFocused) setFocusedId(song.id); }}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${TOP_OFFSET}px)) scale(${scale})`,
                transformOrigin: "center center",
                zIndex, opacity,
                transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
                cursor: isFocused ? "default" : "pointer",
              }}
            >
              <QueueCard
                song={song}
                cardSize={thisCardSize}
                isNowPlaying={isNowPlaying}
                isNextUp={i === nowIdx + 1}
                isFocused={isFocused}
                isPaused={isPaused}
                effectiveStartTime={effectiveStartTime}
              />
            </div>
          );
        });
      })()}
    </div>
  );
}
