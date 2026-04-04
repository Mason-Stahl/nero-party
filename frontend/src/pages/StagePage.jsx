import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParty } from "../context/PartyContext";
import Queue from "../components/Queue";
import Player from "../components/Player";
import MixingTable from "../components/MixingTable";
import History from "../components/History";
import GroupChat from "../components/GroupChat";
import Scoreboard from "../components/Scoreboard";

export default function StagePage() {
  const { partyId, participantId, isHost } = useParty();

  const socketRef                       = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [history,      setHistory]      = useState([]);
  const [connected,    setConnected]    = useState(false);
  const [playback,     setPlayback]     = useState({ isPaused: false, effectiveStartTime: null });
  const [messages,     setMessages]     = useState([]);

  const currentSong = queue.find((s) => s.status === "playing") ?? null;

  function handleSendMessage(body) {
    socketRef.current?.emit("send-message", { partyId, participantId, body });
  }

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
    fetch(`http://localhost:3000/parties/${partyId}/messages`)
      .then((r) => r.json())
      .then(setMessages)
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
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
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

          </>
        )}

        {/* ── Scoreboard (top-center TV) ── */}
        <Scoreboard songs={history} participants={participants} connected={connected} />

        {/* ── History (portal, self-positions) ── */}
        <History songs={history} />

        {/* ── GroupChat (portal, right side) ── */}
        <GroupChat messages={messages} onSendMessage={handleSendMessage} />

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
