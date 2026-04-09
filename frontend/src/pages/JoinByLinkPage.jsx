import { useEffect, useState } from "react";
import GlassPanel from "../components/GlassPanel";
import Input from "../components/Input";
import Btn from "../components/Btn";

const API = "http://localhost:3000";

export default function JoinByLinkPage({ joinCode, onComplete }) {
  const [party,    setParty]    = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [name,     setName]     = useState("");
  const [codeword, setCodeword] = useState("");
  const [joining,  setJoining]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    fetch(`${API}/parties/${joinCode}`)
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(setParty)
      .catch(() => setNotFound(true));
  }, [joinCode]);

  const handleJoin = async () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`${API}/parties/${joinCode}/join`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ displayName: name.trim(), codeword: codeword.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      window.history.replaceState({}, "", "/");
      onComplete({ ...data.party, participantId: data.participantId });
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "inherit",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      {/* Logo / wordmark */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.18em", textTransform: "lowercase" }}>
          Nero Party
        </div>
      </div>

      <GlassPanel style={{ width: "100%", maxWidth: 400, padding: "28px 28px" }}>
        {notFound ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>
              Party not found
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              This invite link may have expired or the party ended.
            </div>
          </div>
        ) : !party ? (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            Looking up party…
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                YOU'RE INVITED TO
              </div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{party.groupName}</div>
              {party.vibe && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                  {party.vibe}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>
                YOUR NAME
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !party.isPrivate && handleJoin()}
                placeholder="what do they call you?"
                autoFocus
              />
            </div>

            {party.isPrivate && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 6 }}>
                  CODEWORD 🔒
                </div>
                <Input
                  type="password"
                  value={codeword}
                  onChange={(e) => setCodeword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="secret word"
                />
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{error}</div>
            )}

            <Btn
              variant="ghost"
              size="lg"
              fullWidth
              disabled={joining || !name.trim()}
              onClick={handleJoin}
              style={{ borderRadius: 12 }}
            >
              {joining ? "Joining…" : "Join Party →"}
            </Btn>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
