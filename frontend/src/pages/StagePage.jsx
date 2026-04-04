import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Queue from "../components/Queue";

export default function StagePage({ hostData }) {
  const socketRef                       = useRef(null);
  const [participants, setParticipants] = useState([]);
  const [queue,        setQueue]        = useState([]);
  const [connected,    setConnected]    = useState(false);

  useEffect(() => {
    if (!hostData?.id || !hostData?.participantId) return;

    // Fetch initial queue
    fetch(`http://localhost:3000/parties/${hostData.id}/songs`)
      .then((r) => r.json())
      .then(setQueue)
      .catch(() => {});

    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-party", {
        partyId:       hostData.id,
        participantId: hostData.participantId,
      });
    });

    socket.on("participants-updated", setParticipants);
    socket.on("queue-updated",        setQueue);
    socket.on("disconnect", () => setConnected(false));

    return () => socket.disconnect();
  }, [hostData?.id, hostData?.participantId]);

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

        {/* ── Participant panel (top-right) ── */}
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          borderRadius: 12,
          padding: "10px 14px",
          minWidth: 160,
          color: "#fff",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            {hostData?.groupName?.toUpperCase()} · {hostData?.joinCode}
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

        {/* ── Queue (bottom) ── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 20px",
        }}>
          <Queue
            songs={queue}
            partyId={hostData?.id}
            participantId={hostData?.participantId}
          />
        </div>

      </div>
    </div>
  );
}
