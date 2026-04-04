import { useState } from "react";
import DialogBubble from "./DialogBubble";
import WristbandButton from "./WristbandButton";
import GlowButton from "./GlowButton";
import HostForm, { NameInput } from "./HostForm";
import JoinForm from "./JoinForm";

export default function DialogSequence({ onComplete }) {
  const [step,      setStep]      = useState("choice");
  const [name,      setName]      = useState("");
  const [joinName,  setJoinName]  = useState("");
  const [hostData,  setHostData]  = useState(null);
  const [joinData,  setJoinData]  = useState(null);
  const [copied,    setCopied]    = useState(false);

  const handleHostSubmit = (data) => {
    setHostData(data);
    setStep("host-confirm");
  };

  const handleJoin = (data) => {
    setJoinData(data);
    setStep("join-confirm");
    setTimeout(() => onComplete?.(data), 2000);
  };

  const handleCopy = () => {
    const joinLink = `${window.location.origin}/join/${hostData.joinCode}`;
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {step === "choice" && (
        <DialogBubble
          mode="bouncer"
          text="Welcome to Nero Party!"
          subtext="You need a group to get in. Let's find you one."
        >
          <div style={{ display: "flex", gap: 10 }}>
            <WristbandButton variant="host" onClick={() => setStep("host-form")}>Host</WristbandButton>
            <WristbandButton variant="join" onClick={() => setStep("join-list")}>Join</WristbandButton>
          </div>
        </DialogBubble>
      )}

      {step === "host-form" && (
        <DialogBubble
          mode="user"
          text="Hosting. My name is"
          textInput={<NameInput value={name} onChange={setName} />}
          subtext="and my group is..."
        >
          <HostForm name={name} onSubmit={handleHostSubmit} />
        </DialogBubble>
      )}

      {step === "join-list" && (
        <DialogBubble
          mode="user"
          text="Joining. My name is"
          textInput={<NameInput value={joinName} onChange={setJoinName} />}
          subtext="pick a group below."
        >
          <JoinForm name={joinName} onJoin={handleJoin} />
        </DialogBubble>
      )}

      {step === "join-confirm" && joinData && (
        <DialogBubble
          mode="bouncer"
          text={`Welcome to ${joinData.groupName}.`}
          subtext={`Come on in, ${joinName}.`}
        />
      )}

      {step === "host-confirm" && hostData && (
        <DialogBubble
          mode="bouncer"
          text={`Oh you're the DJ!?  My apologies, I didn't recognize you ${hostData.hostName}.`}
          subtext="Share this with your crew, then head in."
        >
          {/* Join code + copy row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.15em",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              padding: "4px 14px",
            }}>
              {hostData.joinCode}
            </div>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 11,
                fontWeight: 600,
                background: copied ? "rgba(34,197,94,0.15)" : "#eee",
                color:      copied ? "rgb(34,197,94)" : "#444",
                border:     copied ? "1px solid rgba(34,197,94,0.4)" : "1px solid #ccc",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "copied!" : "copy link"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <GlowButton onClick={() => onComplete?.({ ...hostData, isHost: true })}>Let's go →</GlowButton>
          </div>
        </DialogBubble>
      )}
    </div>
  );
}
