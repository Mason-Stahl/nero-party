import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParty } from "../context/PartyContext";
import Queue from "../components/Queue";
import Player from "../components/Player";
import MixingTable from "../components/MixingTable";
import History from "../components/History";

export default function StagePage() {
  const { partyId, participantId, isHost, joinCode, groupName } = useParty();

  const socketRef                       = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [history,      setHistory]      = useState([]);
  const [connected,    setConnected]    = useState(false);
  const [playback,     setPlayback]     = useState({ isPaused: false, effectiveStartTime: null });

  const currentSong = queue.find((s) => s.status === "playing") ?? null;

  useEffect(() => {
    if (!partyId || !participantId) return;

    fetch(`http://localhost:3000/parties/${partyId}/songs`)
      .then((r) => r.json())
      .then(setQueue)
      .catch(() => {});
    fetch(`http://localhost:3000/parties/${partyId}/songs/history`)
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => {});

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-party", { partyId, participantId });
    });

    socket.on("participants-updated", setParticipants);
    socket.on("queue-updated",        setQueue);
    socket.on("playback-updated",     setPlayback);
    socket.on("history-updated",      setHistory);
    socket.on("disconnect", () => setConnected(false));

    return () => socket.disconnect();
  }, [partyId, participantId]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <img
        src="/images/stage.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>

        {/* ── Host: MixingTable ── */}
        {isHost ? (
          <div style={{
            position:  "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -56%)",
            width:     "min(86vw, 760px)",
            zIndex:    2,
          }}>
            <MixingTable
              songs={queue}
              participants={participants}
              isPaused={playback.isPaused}
              effectiveStartTime={playback.effectiveStartTime}
            />
          </div>
        ) : (
          /* ── Guest: Player + participant sidebar ── */
          <>
            <div style={{
              position:  "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -62%)",
              width:     "min(48vw, 480px)",
              zIndex:    2,
            }}>
              <Player
                song={currentSong}
                isPaused={playback.isPaused}
                effectiveStartTime={playback.effectiveStartTime}
              />
            </div>

            <div style={{
              position:       "absolute",
              top:            16,
              right:          16,
              background:     "rgba(0,0,0,0.55)",
              backdropFilter: "blur(6px)",
              borderRadius:   12,
              padding:        "10px 14px",
              minWidth:       160,
              color:          "#fff",
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
                {groupName?.toUpperCase()} · {joinCode}
              </div>
              <div style={{ fontSize: 11, color: connected ? "rgb(34,197,94)" : "#f87171", marginBottom: 8 }}>
                {connected ? "● live" : "○ connecting…"}
              </div>
              {participants.map((p) => (
                <div key={p.id} style={{ fontSize: 12, padding: "2px 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>▶</span>
                  {p.displayName}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── History (portal, self-positions) ── */}
        <History songs={history} />

        {/* ── Queue (bottom strip) ── */}
        <div style={{
          position:       "absolute",
          bottom:         0, left: 0, right: 0,
          background:     "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          borderTop:      "1px solid rgba(255,255,255,0.08)",
          padding:        "14px 20px",
        }}>
          <Queue songs={queue} />
        </div>

      </div>
    </div>
  );
}
