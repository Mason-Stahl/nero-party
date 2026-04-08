import Scoreboard from "../components/Scoreboard";

export default function TopBar({ songs, participants, connected, onLeave }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Scoreboard
        songs={songs}
        participants={participants}
        connected={connected}
        onLeave={onLeave}
      />
    </div>
  );
}
