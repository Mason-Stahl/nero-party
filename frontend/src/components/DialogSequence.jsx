import { useState } from "react";
import DialogBubble from "./DialogBubble";
import WristbandButton from "./WristbandButton";
import HostForm from "./HostForm";

/**
 * DialogSequence
 * Owns all dialog step state after the NeroIntro animation completes.
 * Steps: "choice" | "host-form" | "host-confirm"
 */
export default function DialogSequence() {
  const [step,     setStep]     = useState("choice");
  const [hostData, setHostData] = useState(null);

  const handleHostSubmit = (data) => {
    setHostData(data);
    setStep("host-confirm");
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
            <WristbandButton variant="join" onClick={() => {}}>Join</WristbandButton>
          </div>
        </DialogBubble>
      )}

      {step === "host-form" && (
        <DialogBubble mode="user" text="Hosting. My name is...">
          <HostForm onSubmit={handleHostSubmit} />
        </DialogBubble>
      )}

      {step === "host-confirm" && hostData && (
        <DialogBubble
          mode="bouncer"
          text={`Oh you're the DJ!? My apologies for not recognizing you, ${hostData.hostName}.`}
          subtext="Come on in."
        />
      )}
    </div>
  );
}
