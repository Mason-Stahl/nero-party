import Queue from "../Queue";
import MixingTable from "../MixingTable";

export default function MiddleZone({
  isHost,
  songs,
  history,
  participants,
  isPaused,
  effectiveStartTime,
}) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {isHost ? (
        <div style={{
          position:  "absolute",
          top:       "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width:     "min(86vw, 760px)",
        }}>
          <MixingTable
            songs={songs}
            history={history}
            participants={participants}
            isPaused={isPaused}
            effectiveStartTime={effectiveStartTime}
          />
        </div>
      ) : (
        <Queue
          songs={songs}
          history={history}
          isPaused={isPaused}
          effectiveStartTime={effectiveStartTime}
        />
      )}
    </div>
  );
}

