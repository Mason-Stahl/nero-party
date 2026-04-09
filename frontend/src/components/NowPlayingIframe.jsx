// ── YouTube iframe player — no native controls, interaction blocked ────────────

import { useEffect, useRef } from "react";

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

export function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1);
    return u.searchParams.get("v");
  } catch { return null; }
}

export default function NowPlayingIframe({ song, isPaused, effectiveStartTime }) {
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
        playerVars: {
          autoplay:       1,
          start:          elapsed,
          rel:            0,
          modestbranding: 1,
          controls:       0,   // no YouTube controls UI
          disablekb:      1,   // no keyboard shortcuts
          fs:             0,   // no fullscreen button
          iv_load_policy: 3,   // no annotations
        },
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
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {/* Transparent blocker — host controls playback via CircleBtns, not the iframe */}
      <div style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}
