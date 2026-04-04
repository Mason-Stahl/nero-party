import { useEffect, useRef, useState } from "react";
import { useParty } from "../context/PartyContext";

// Loads the YT IFrame API script once globally
function loadYTScript() {
  if (window.YT || document.getElementById("yt-iframe-api")) return;
  const tag = document.createElement("script");
  tag.id  = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

// Resolves when window.YT.Player is available
function whenYTReady() {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch { return null; }
}

export default function Player({ song, isPaused = false, effectiveStartTime = null }) {
  const { partyId, participantId, isHost } = useParty();
  const containerRef = useRef(null);
  const playerRef    = useRef(null);   // YT.Player instance
  const videoId      = song ? extractVideoId(song.youtubeUrl) : null;

  // Track whether the player is ready to accept commands
  const readyRef     = useRef(false);
  const pendingRef   = useRef(null);   // queued command to run once ready

  // ── Load YT script on first mount ────────────────────────────────────────────
  useEffect(() => { loadYTScript(); }, []);

  // ── Recreate YT.Player whenever the videoId changes ──────────────────────────
  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    readyRef.current = false;
    // Destroy previous instance
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }

    // Replace container div (YT.Player replaces the element in-place)
    const div = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(div);

    const elapsedSec = effectiveStartTime
      ? Math.max(0, Math.floor((Date.now() - effectiveStartTime) / 1000))
      : 0;

    whenYTReady().then(() => {
      playerRef.current = new window.YT.Player(div, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay:       1,
          start:          elapsedSec,
          rel:            0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            readyRef.current = true;
            // Apply any pending command (pause) that arrived before ready
            if (pendingRef.current) {
              pendingRef.current(e.target);
              pendingRef.current = null;
            }
            // If currently paused at load time, pause immediately
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
    // Only re-run when the video itself changes, not on every prop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // ── React to isPaused / effectiveStartTime changes ───────────────────────────
  useEffect(() => {
    const apply = (p) => {
      if (isPaused) {
        p.pauseVideo();
      } else {
        // Seek to current position to resync on resume, then play
        const elapsed = effectiveStartTime
          ? Math.max(0, Math.floor((Date.now() - effectiveStartTime) / 1000))
          : 0;
        p.seekTo(elapsed, true);
        p.playVideo();
      }
    };

    if (readyRef.current && playerRef.current) {
      apply(playerRef.current);
    } else if (playerRef.current) {
      // Queue the command for when onReady fires
      pendingRef.current = apply;
    }
  }, [isPaused, effectiveStartTime]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: 560,
      margin: "0 auto",
    }}>
      {/* TV bezel */}
      <div style={{
        background: "#111",
        border: "4px solid #222",
        borderRadius: 12,
        boxShadow: videoId
          ? "0 0 32px rgba(120,80,255,0.5), 0 0 8px rgba(120,80,255,0.3), inset 0 0 12px rgba(0,0,0,0.8)"
          : "0 0 12px rgba(0,0,0,0.6), inset 0 0 12px rgba(0,0,0,0.8)",
        overflow: "hidden",
        transition: "box-shadow 0.6s ease",
      }}>
        {/* Screen */}
        <div style={{ position: "relative", paddingBottom: "56.25%" }}>
          {videoId ? (
            <div
              ref={containerRef}
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
              }}
            />
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              background: "#0a0a0a",
              color: "rgba(255,255,255,0.15)",
              gap: 8,
            }}>
              <div style={{ fontSize: 32 }}>📺</div>
              <div style={{ fontSize: 11, letterSpacing: "0.15em" }}>WAITING FOR DJ</div>
            </div>
          )}
        </div>

        {/* Info bar */}
        <div style={{
          padding: "8px 12px",
          background: "rgba(0,0,0,0.85)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          minHeight: 52,
        }}>
          {song ? (
            <>
              {song.thumbnailUrl && (
                <img src={song.thumbnailUrl} alt="" aria-hidden="true"
                  style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: "#fff",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {song.title}
                </div>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.45)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {song.artist}
                </div>
              </div>
              <div style={{
                flexShrink: 0,
                fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em",
                color: isPaused ? "rgba(245,158,11,0.9)" : "rgb(120,80,255)",
                background: isPaused ? "rgba(245,158,11,0.12)" : "rgba(120,80,255,0.12)",
                border: `1px solid ${isPaused ? "rgba(245,158,11,0.3)" : "rgba(120,80,255,0.3)"}`,
                borderRadius: 4, padding: "2px 6px",
                transition: "all 0.2s",
              }}>
                {isPaused ? "PAUSED" : "NOW PLAYING"}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              no song playing
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
