import { useState } from "react";
// @ts-ignore
import NeroIntro from "./components/NeroIntro";
// @ts-ignore
import StagePage from "./pages/StagePage";

type AppPage = "intro" | "stage";

export default function App() {
  const [page,     setPage]     = useState<AppPage>("intro");
  const [fadeOut,  setFadeOut]  = useState(false);
  const [hostData, setHostData] = useState<any>(null);

  const handleIntroComplete = (data: any) => {
    setHostData(data);
    setFadeOut(true);                                   // fade to black over 2s
    setTimeout(() => setPage("stage"), 2000);           // swap page at peak black
    setTimeout(() => setFadeOut(false), 2200);          // fade back in
  };

  return (
    <>
      {page === "intro" && <NeroIntro onComplete={handleIntroComplete} />}
      {page === "stage" && <StagePage hostData={hostData} />}

      <div style={{
        position: "fixed", inset: 0,
        backgroundColor: "#000",
        zIndex: 99999,
        opacity: fadeOut ? 1 : 0,
        pointerEvents: "none",
        transition: "opacity 2s ease",
      }} />
    </>
  );
}
