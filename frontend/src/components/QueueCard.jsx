// ── Single card in the carousel (video or vinyl disc) ─────────────────────────

import NowPlayingIframe from "./NowPlayingIframe";
import VinylDisc        from "./VinylDisc";

const INFO_H = 64;

export default function QueueCard({
  song,
  cardSize,
  isNowPlaying,
  isNextUp,
  isFocused,
  isPaused,
  effectiveStartTime,
}) {
  const vinylSize = Math.round(cardSize * (isNextUp ? 0.58 : 0.50));
  const radius    = Math.round(cardSize * 0.045);
  const videoH    = isNowPlaying ? Math.round(cardSize * 9 / 16) : cardSize;

  const border = isFocused
    ? "1px solid rgba(255,255,255,0.18)"
    : "1px solid rgba(255,255,255,0.07)";

  return (
    <div style={{ width: cardSize, borderRadius: radius, overflow: "hidden", border, transition: "border 0.3s" }}>

      {/* Main face — video (now playing) or vinyl disc */}
      <div style={{ width: cardSize, height: videoH, position: "relative" }}>
        {song.thumbnailUrl ? (
          <img src={song.thumbnailUrl} alt="" aria-hidden="true" style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            filter: isNowPlaying
              ? "brightness(0.1) saturate(0.3)"
              : "brightness(0.22) saturate(0.55)",
          }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#111" }} />
        )}

        {isNowPlaying ? (
          <NowPlayingIframe
            song={song}
            isPaused={isPaused}
            effectiveStartTime={effectiveStartTime}
          />
        ) : (
          <>
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <VinylDisc song={song} spinning={isNextUp} size={vinylSize} />
            </div>
            {/* Title/artist overlay */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)",
              padding: `${Math.round(cardSize * 0.1)}px ${Math.round(cardSize * 0.04)}px ${Math.round(cardSize * 0.035)}px`,
              pointerEvents: "none",
            }}>
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
          </>
        )}
      </div>

      {/* Info bar — now-playing card only */}
      {isNowPlaying && (
        <div style={{
          height: INFO_H,
          background: "#111",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
        }}>
          {song.thumbnailUrl && (
            <img src={song.thumbnailUrl} alt="" aria-hidden="true"
              style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
          )}
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div style={{
              fontSize: 8, fontWeight: 800, letterSpacing: "0.14em",
              color: "rgb(74,222,128)", marginBottom: 2,
            }}>
              NOW PLAYING
            </div>
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
            color:      isPaused ? "rgba(245,158,11,0.9)"   : "rgb(120,80,255)",
            background: isPaused ? "rgba(245,158,11,0.12)"  : "rgba(120,80,255,0.12)",
            border: `1px solid ${isPaused ? "rgba(245,158,11,0.3)" : "rgba(120,80,255,0.3)"}`,
            borderRadius: 4, padding: "2px 6px",
            transition: "all 0.2s",
          }}>
            {isPaused ? "PAUSED" : "LIVE"}
          </div>
        </div>
      )}
    </div>
  );
}
