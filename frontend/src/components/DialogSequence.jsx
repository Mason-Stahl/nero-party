import { useState } from "react";
import DialogBubble from "./DialogBubble";
import WristbandButton from "./WristbandButton";
import HostForm, { NameInput } from "./HostForm";

/**
 * DialogSequence
 * Owns all dialog step state after the NeroIntro animation completes.
 * Steps: "choice" | "host-form" | "host-confirm"
 */
export default function DialogSequence({ onComplete }) {
  const [step,     setStep]     = useState("choice");
  const [name,     setName]     = useState("");
  const [hostData, setHostData] = useState(null);

  const handleHostSubmit = (data) => {
    setHostData(data);
    setStep("host-confirm");
    // Let the confirm bubble show for 2.5s then trigger transition
    setTimeout(() => onComplete?.(data), 2500);
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
        <DialogBubble
          mode="user"
          text="Hosting. My name is"
          textInput={<NameInput value={name} onChange={setName} />}
          subtext="and my group is..."
        >
          <HostForm name={name} onSubmit={handleHostSubmit} />
        </DialogBubble>
      )}

      {step === "host-confirm" && hostData && (
        <DialogBubble
          mode="bouncer"
          text={`Oh you're the DJ!?  \n My apologies for not recognizing you, ${hostData.hostName}.`}
          subtext="Come on in."
        />
      )}
    </div>
  );
}
