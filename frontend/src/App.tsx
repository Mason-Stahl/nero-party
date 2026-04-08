import { useEffect, useState } from "react";
// @ts-ignore
import LobbyPage from "./pages/LobbyPage";
// @ts-ignore
import StagePage from "./pages/StagePage";
// @ts-ignore
import { PartyProvider } from "./context/PartyContext";

const SESSION_KEY = "nero_session";
const API = "http://localhost:3000";

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

type AppPage = "intro" | "stage";

export default function App() {
  const saved                   = loadSession();
  const [page,     setPage]     = useState<AppPage>(saved ? "stage" : "intro");
  const [fadeOut,  setFadeOut]  = useState(false);
  const [hostData, setHostData] = useState<any>(saved);

  // Validate saved session — drop it if the party no longer exists
  useEffect(() => {
    if (!saved?.id) return;
    fetch(`${API}/parties/${saved.joinCode}`)
      .then(r => { if (!r.ok) throw new Error("gone"); })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setHostData(null);
        setPage("intro");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIntroComplete = (data: any) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setHostData(data);
    setFadeOut(true);                                   // fade to black over 2s
    setTimeout(() => setPage("stage"), 2000);           // swap page at peak black
    setTimeout(() => setFadeOut(false), 2200);          // fade back in
  };

  const handleLeave = () => {
    localStorage.removeItem(SESSION_KEY);
    setHostData(null);
    setPage("intro");
  };

  return (
    <>
      {page === "intro" && <LobbyPage onComplete={handleIntroComplete} />}
      {page === "stage" && (
        <PartyProvider data={hostData}>
          <StagePage onLeave={handleLeave} />
        </PartyProvider>
      )}

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
