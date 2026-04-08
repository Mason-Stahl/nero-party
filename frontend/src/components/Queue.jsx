import { useState, useEffect, useRef, useCallback } from "react";
import Btn from "./Btn";

const SPIN_CSS = `
@keyframes vinyl-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}`;

// ── Responsive card size ──────────────────────────────────────────────────────
// Fits inside the 50vh middle zone on any screen, capped at 420px
function calcCardSize() {
  const byHeight = window.innerHeight * 0.40;
  const byWidth  = window.innerWidth  * 0.72;
  return Math.min(420, byHeight, byWidth);
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

// offset from focusedIdx → visual properties, tx scales with cardSize
function offsetProps(offset, cardSize) {
  const abs  = Math.abs(offset);
  const sign = offset >= 0 ? 1 : -1;
  if (abs === 0) return { tx: 0,                              scale: 1,    zIndex: 10, opacity: 1    };
  if (abs === 1) return { tx: sign * Math.round(cardSize * 0.70), scale: 0.74, zIndex: 8,  opacity: 0.88 };
  if (abs === 2) return { tx: sign * Math.round(cardSize * 1.12), scale: 0.58, zIndex: 6,  opacity: 0.72 };
  return null;
}

// ── YT helpers ────────────────────────────────────────────────────────────────
function loadYTScript() {
  if (window.YT || document.getElementById("yt-iframe-api")) return;
  const tag = document.createElement("script");
  tag.id  = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function whenYTReady() {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
  });
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch { return null; }
}

// ── NowPlayingIframe ──────────────────────────────────────────────────────────
function NowPlayingIframe({ song, isPaused, effectiveStartTime }) {
  const containerRef = useRef(null);
  const playerRef    = useRef(null);
  const readyRef     = useRef(false);
  const pendingRef   = useRef(null);
  const videoId      = song ? extractVideoId(song.youtubeUrl) : null;

  useEffect(() => { loadYTScript(); }, []);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;
    readyRef.current = false;
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    const div = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(div);

    const elapsed = effectiveStartTime
      ? Math.max(0, Math.floor((Date.now() - effectiveStartTime) / 1000))
      : 0;

    whenYTReady().then(() => {
      playerRef.current = new window.YT.Player(div, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: { autoplay: 1, start: elapsed, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            if (pendingRef.current) { pendingRef.current(e.target); pendingRef.current = null; }
            if (isPaused) e.target.pauseVideo();
          },
        },
      });
    });

    return () => {
      readyRef.current = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    const apply = (p) => {
      if (isPaused) {
        p.pauseVideo();
      } else {
        const elapsed = effectiveStartTime
          ? Math.max(0, Math.floor((Date.now() - effectiveStartTime) / 1000))
          : 0;
        p.seekTo(elapsed, true);
        p.playVideo();
      }
    };
    if (readyRef.current && playerRef.current) apply(playerRef.current);
    else if (playerRef.current) pendingRef.current = apply;
  }, [isPaused, effectiveStartTime]);

  return (
    <div ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
  );
}

// ── VinylDisc ─────────────────────────────────────────────────────────────────
function VinylDisc({ song, spinning, size }) {
  const r     = size / 2;
  const inner = r * 0.30;

  return (
    <div style={{
      width: size, height: size,
      position: "relative",
      animation: spinning ? "vinyl-spin 4s linear infinite" : "none",
      flexShrink: 0,
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <circle cx={r} cy={r} r={r - 1} fill="#0d0d0d" />
        <circle cx={r} cy={r} r={r - 1} fill="none" stroke="#222" strokeWidth="0.5" />
        {[0.44, 0.39, 0.34, 0.30, 0.26, 0.22, 0.18].map((ratio, i) => (
          <circle key={i} cx={r} cy={r} r={r * ratio}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
        ))}
        <circle cx={r} cy={r} r={inner} fill={spinning ? "rgb(120,80,255)" : "#1a1a1a"} />
      </svg>

      {song?.thumbnailUrl && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: inner * 2, height: inner * 2,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%", overflow: "hidden", pointerEvents: "none",
        }}>
          <img src={song.thumbnailUrl} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 6, height: 6,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.1)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ── QueueCard ─────────────────────────────────────────────────────────────────
function QueueCard({ song, cardSize, isNowPlaying, isNextUp, isFocused, isPaused, effectiveStartTime }) {
  const reflectH  = Math.round(cardSize * 0.22);
  const vinylSize = Math.round(cardSize * (isNextUp ? 0.50 : 0.43));

  const border = isNowPlaying
    ? "1px solid rgba(74,222,128,0.5)"
    : isFocused
      ? "1px solid rgba(255,255,255,0.2)"
      : "1px solid rgba(255,255,255,0.07)";

  const shadow = isNowPlaying
    ? "0 0 40px rgba(74,222,128,0.2), 0 0 80px rgba(74,222,128,0.08)"
    : isFocused
      ? "0 0 30px rgba(255,255,255,0.06)"
      : "none";

  return (
    <div>
      {/* Card */}
      <div style={{
        width: cardSize, height: cardSize,
        position: "relative",
        borderRadius: Math.round(cardSize * 0.045),
        overflow: "hidden",
        border, boxShadow: shadow,
        transition: "border 0.3s, box-shadow 0.3s",
      }}>
        {song.thumbnailUrl ? (
          <img src={song.thumbnailUrl} alt="" aria-hidden="true" style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: isNowPlaying ? "brightness(0.12) saturate(0.4)" : "brightness(0.22) saturate(0.55)",
          }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#111" }} />
        )}

        {isNowPlaying ? (
          <NowPlayingIframe song={song} isPaused={isPaused} effectiveStartTime={effectiveStartTime} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <VinylDisc song={song} spinning={isNextUp} size={vinylSize} />
          </div>
        )}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
          padding: `${Math.round(cardSize * 0.1)}px ${Math.round(cardSize * 0.04)}px ${Math.round(cardSize * 0.035)}px`,
          pointerEvents: "none",
        }}>
          {isNowPlaying && (
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: "rgb(74,222,128)", marginBottom: 5 }}>
              NOW PLAYING
            </div>
          )}
          <div style={{
            fontSize: Math.round(cardSize * 0.034), fontWeight: 700, color: "#fff", lineHeight: 1.3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {song.title}
          </div>
          <div style={{
            fontSize: Math.round(cardSize * 0.027), color: "rgba(255,255,255,0.5)", marginTop: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {song.artist ?? song.addedBy?.displayName}
          </div>
        </div>
      </div>

      {/* Reflection */}
      <div style={{
        width: cardSize, height: reflectH,
        overflow: "hidden", position: "relative", pointerEvents: "none",
        borderRadius: "0 0 8px 8px",
      }}>
        {song.thumbnailUrl && (
          <img src={song.thumbnailUrl} alt="" aria-hidden="true" style={{
            width: "100%", height: reflectH * 3,
            objectFit: "cover", objectPosition: "bottom",
            transform: "scaleY(-1)",
            filter: "brightness(0.18) saturate(0.4)",
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.97) 15%, rgba(0,0,0,0.55) 60%, transparent 100%)",
        }} />
      </div>
    </div>
  );
}

// ── Queue ─────────────────────────────────────────────────────────────────────
export default function Queue({
  songs              = [],
  history            = [],
  isPaused           = false,
  effectiveStartTime = null,
}) {
  const containerRef = useRef(null);
  const lastWheelRef = useRef(0);
  const cardSize     = useCardSize();
  const reflectH     = Math.round(cardSize * 0.22);

  const allSongs = [...history, ...songs];
  const nowIdx   = allSongs.findIndex((s) => s.status === "playing");

  const [focusedIdx, setFocusedIdx] = useState(0);

  useEffect(() => {
    if (nowIdx >= 0) setFocusedIdx(nowIdx);
  }, [nowIdx]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastWheelRef.current < 380) return;
    lastWheelRef.current = now;
    const dir = e.deltaY > 0 ? 1 : -1;
    setFocusedIdx((f) => Math.max(0, Math.min(allSongs.length - 1, f + dir)));
  }, [allSongs.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (allSongs.length === 0) return null;

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <style>{SPIN_CSS}</style>

      {/* Card stack */}
      {allSongs.map((song, i) => {
        const offset = i - focusedIdx;
        const props  = offsetProps(offset, cardSize);
        if (!props) return null;

        const { tx, scale, zIndex, opacity } = props;
        const isNowPlaying = song.status === "playing";
        const isNextUp     = i === nowIdx + 1;
        const isFocused    = offset === 0;

        return (
          <div
            key={song.id}
            onClick={() => { if (!isFocused) setFocusedIdx(i); }}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: `translate(calc(-50% + ${tx}px), calc(-50% - ${reflectH / 2}px)) scale(${scale})`,
              transformOrigin: "center center",
              zIndex, opacity,
              transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
              cursor: isFocused ? "default" : "pointer",
            }}
          >
            <QueueCard
              song={song}
              cardSize={cardSize}
              isNowPlaying={isNowPlaying}
              isNextUp={isNextUp}
              isFocused={isFocused}
              isPaused={isPaused}
              effectiveStartTime={effectiveStartTime}
            />
          </div>
        );
      })}

      {/* Nav buttons — above card stack */}
      <div style={{
        position: "absolute",
        top: 10, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 8,
        zIndex: 20, whiteSpace: "nowrap",
      }}>
        <Btn variant="ghost" size="sm"
          onClick={() => setFocusedIdx((f) => Math.max(0, f - 1))}
          style={{ borderRadius: "50%", padding: "4px 11px", fontSize: 18, lineHeight: 1 }}>
          ‹
        </Btn>
        <Btn variant="ghost" size="sm"
          onClick={() => setFocusedIdx((f) => Math.min(allSongs.length - 1, f + 1))}
          style={{ borderRadius: "50%", padding: "4px 11px", fontSize: 18, lineHeight: 1 }}>
          ›
        </Btn>
        <Btn variant="ghost" size="sm"
          onClick={() => { if (nowIdx >= 0) setFocusedIdx(nowIdx); }}
          disabled={nowIdx < 0 || focusedIdx === nowIdx}
          style={{ fontSize: 10, letterSpacing: "0.05em" }}>
          jump to present
        </Btn>
      </div>
    </div>
  );
}
