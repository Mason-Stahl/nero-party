import { useParty } from "../../context/PartyContext";
import CircleBtn from "../CircleBtn";
import Btn from "../Btn";

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
  </svg>
);

export default function TopBar({ participants, connected, onLeave, onOpenSettings }) {
  const { isHost, groupName, participantId } = useParty();
  const displayName = participants.find((p) => p.id === participantId)?.displayName ?? "";

  return (
    <>
    <div style={{
      position:             "absolute",
      top: 0, left: 0, right: 0,
      height:               60,
      background:           "rgba(255,255,255,0.05)",
      backdropFilter:       "blur(28px) saturate(160%)",
      WebkitBackdropFilter: "blur(28px) saturate(160%)",
      borderBottom:         "1px solid rgba(255,255,255,0.09)",
      boxShadow:            "0 2px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
      display:              "flex",
      alignItems:           "center",
      paddingLeft:          "10%",
      paddingRight:         "10%",
      gap:                  12,
    }}>

      {/* Status text */}
      <span style={{
        flex: 1, minWidth: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "sans-serif", fontSize: 11,
        fontWeight: 700, letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.5)",
      }}>
        {displayName} · {groupName?.toUpperCase()} · {participants.length} connected
      </span>

      {/* Live indicator */}
      <span style={{
        flexShrink: 0,
        fontFamily: "sans-serif", fontSize: 11,
        color: connected ? "rgb(34,197,94)" : "#f87171",
      }}>
        {connected ? "● live" : "○ connecting…"}
      </span>

      {/* LEAVE */}
      <Btn
        variant="danger"
        size="sm"
        onClick={onLeave ?? (() => window.location.reload())}
      >
        LEAVE
      </Btn>
    </div>

    {/* Gear — host only, below the bar */}
    {isHost && (
      <div style={{
        position:  "absolute",
        top:   80,
        right: "10%",
      }}>
        <CircleBtn onClick={onOpenSettings} label="SETTINGS">
          <GearIcon />
        </CircleBtn>
      </div>
    )}
    </>
  );
}
