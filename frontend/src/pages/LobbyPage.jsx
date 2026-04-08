import { useEffect, useState } from "react";
import Btn from "../components/Btn";

const API = "http://localhost:3000";
const MUTED = "rgba(255,255,255,0.45)";
const GREEN = "#4ade80";

// ── Ambient blobs ────────────────────────────────────────────────────────────
// Each blob: color (rgba), position (top/bottom/left/right as CSS strings),
// size { w, h } in px, and blur in px. Opacity is baked into the rgba alpha.
const BLOBS = [
  {
    color: "rgba(74,222,128,0.0)",   // green
    top: "-15%", left: "50%",
    transform: "translateX(-45%)",
    w: 600, h: 400,
    blur: 300,
  },
  {
    color: "rgba(139,92,246,0.0)",   // purple
    bottom: "-10%", left: "-10%",
    w: 500, h: 400,
    blur: 300,
  },
  {
    color: "rgba(34,211,238,0.0)",   // teal
    bottom: "10%", right: "-5%",
    w: 380, h: 300,
    blur: 300,
  },
];

// ── Glass card ────────────────────────────────────────────────────────────────
// inset highlight on top edge gives the "liquid" refraction feel
const CARD = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 16,
  backdropFilter: "blur(28px) saturate(160%)",
  WebkitBackdropFilter: "blur(28px) saturate(160%)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  color: "#fff",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

export default function LobbyPage({ onComplete }) {
  const [name, setName] = useState("");

  // host panel
  const [showHost, setShowHost] = useState(false);
  const [group, setGroup] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [hostCodeword, setHostCodeword] = useState("");
  const [vibe, setVibe] = useState("");
  const [hosting, setHosting] = useState(false);
  const [hostError, setHostError] = useState(null);

  // lobby list
  const [parties, setParties] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [expandedCode, setExpandedCode] = useState(null);
  const [codeword, setCodeword] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  // info modal
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetch(`${API}/parties`)
      .then((r) => r.json())
      .then((d) => { setParties(d); setListLoading(false); })
      .catch(() => setListLoading(false));
  }, []);

  const handleJoin = async (party, pw = "") => {
    if (!name.trim()) { setJoinError("Enter your name first"); return; }
    setJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`${API}/parties/${party.joinCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), codeword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      onComplete({ ...data.party, participantId: data.participantId });
    } catch (err) {
      setJoinError(err.message);
      setJoining(false);
    }
  };

  const handleHost = async () => {
    if (!name.trim() || !group.trim()) { setHostError("Name and group name required"); return; }
    setHosting(true);
    setHostError(null);
    try {
      const res = await fetch(`${API}/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: name.trim(),
          groupName: group.trim(),
          isPrivate,
          codeword: isPrivate ? hostCodeword.trim() : undefined,
          vibe: vibe.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create party");
      const { party, participantId } = await res.json();
      onComplete({ ...party, participantId, isHost: true });
    } catch (err) {
      setHostError(err.message);
      setHosting(false);
    }
  };

  const canHost = !!(name.trim() && group.trim() && !hosting);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "inherit",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Ambient blobs — give the glass something to blur through ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {BLOBS.map((b, i) => (
          <div key={i} style={{
            position: "absolute",
            top: b.top, bottom: b.bottom,
            left: b.left, right: b.right,
            transform: b.transform,
            width: b.w, height: b.h,
            background: `radial-gradient(ellipse, ${b.color} 0%, transparent 70%)`,
            filter: `blur(${b.blur}px)`,
          }} />
        ))}
      </div>

      {/* ── Navbar ── */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 64,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        position: "relative",
        padding: "0 24px",
        zIndex: 10,
        background: "rgba(10,10,10,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Nero Party
        </span>
        <div style={{ position: "absolute", right: 24 }}>
          <Btn size="sm" onClick={() => setShowInfo(true)}>Learn More</Btn>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{
        flex: 1,
        position: "relative",
        zIndex: 10,
      }}>

        <div style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>

        

        {/* Name card — always visible */}
        <div style={{ ...CARD, width: "100%", maxWidth: 560, padding: "20px 24px" }}>
          <Label>YOUR NAME</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="what do they call you?"
            style={{ ...inputStyle, fontSize: 15, padding: "10px 14px" }}
            autoFocus
          />
        </div>

        {/* Guest list card */}
        {!showHost && (
          <div style={{ ...CARD, width: "100%", maxWidth: 560, padding: "20px 24px" }}>
            <div style={{ paddingLeft: 12 }}><Label>GUEST LIST</Label></div>

            {listLoading && (
              <div style={{ fontSize: 13, color: MUTED, padding: "10px 12px" }}>Looking for parties…</div>
            )}
            {!listLoading && parties.length === 0 && (
              <div style={{ fontSize: 13, color: MUTED, padding: "10px 12px" }}>No open parties right now.</div>
            )}
            {!listLoading && parties.length > 0 && (
              <div style={{
                maxHeight: 232, overflowY: "auto", paddingLeft: 12, paddingRight: 12,
                maskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)",
              }}>
                {parties.map((party) => {
                  const isExpanded = expandedCode === party.joinCode;
                  const canJoin = !joining && !!name.trim();
                  return (
                    <div key={party.joinCode}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14, flex: "0 0 auto",
                          maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {party.groupName}
                        </span>
                        <span style={{ fontSize: 13, flex: "0 0 auto" }}>
                          {party.isPrivate ? "🔒" : "🔓"}
                        </span>
                        <span style={{
                          fontSize: 12, color: MUTED, flex: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {party.vibe || "—"}
                        </span>
                        <span style={{ fontSize: 12, color: MUTED, flex: "0 0 auto", whiteSpace: "nowrap" }}>
                          {party._count.participants} in
                        </span>
                        <Btn
                          size="sm"
                          variant="ghost"
                          disabled={!canJoin}
                          style={{ borderRadius: 12 }}
                          onClick={() => {
                            if (party.isPrivate) {
                              setExpandedCode(isExpanded ? null : party.joinCode);
                              setCodeword("");
                              setJoinError(null);
                            } else {
                              handleJoin(party);
                            }
                          }}
                        >
                          join
                        </Btn>
                      </div>

                      {isExpanded && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 10 }}>
                          <input
                            autoFocus
                            type="password"
                            value={codeword}
                            onChange={(e) => setCodeword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && canJoin && handleJoin(party, codeword)}
                            placeholder="codeword"
                            style={{ ...inputStyle, flex: 1, padding: "6px 10px" }}
                          />
                          <Btn
                            size="sm"
                            variant="ghost"
                            disabled={!canJoin || !codeword.trim()}
                            style={{ borderRadius: 12 }}
                            onClick={() => handleJoin(party, codeword)}
                          >
                            enter
                          </Btn>
                        </div>
                      )}
                      <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.1) 50%, transparent)" }} />
                    </div>
                  );
                })}
              </div>
            )}

            {joinError && (
              <div style={{ fontSize: 12, color: "#f87171", marginTop: 8, paddingLeft: 12 }}>{joinError}</div>
            )}
          </div>
        )}

        {/* New party card */}
        {showHost && (
          <div style={{ ...CARD, width: "100%", maxWidth: 560, padding: "20px 24px" }}>
            <div style={{ padding: "0 12px" }}>
              <Label>HOST A NEW PARTY</Label>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>Group name</label>
                <input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="what's the crew called?"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>Vibe (optional)</label>
                <input
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="lofi, hardstyle, anything goes…"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: MUTED }}>Private</label>
                <Btn
                  size="sm"
                  variant={isPrivate ? "primary" : "ghost"}
                  onClick={() => setIsPrivate((p) => !p)}
                  style={{ borderRadius: 12 }}
                >
                  {isPrivate ? "🔒 yes" : "🔓 no"}
                </Btn>
              </div>

              {isPrivate && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: MUTED, display: "block", marginBottom: 4 }}>Codeword</label>
                  <input
                    type="password"
                    value={hostCodeword}
                    onChange={(e) => setHostCodeword(e.target.value)}
                    placeholder="secret word"
                    style={inputStyle}
                  />
                </div>
              )}

              {hostError && (
                <div style={{ fontSize: 12, color: "#f87171", marginBottom: 10 }}>{hostError}</div>
              )}

              <Btn
                variant="primary"
                size="lg"
                fullWidth
                disabled={!canHost}
                onClick={handleHost}
                style={{ borderRadius: 12 }}
              >
                {hosting ? "Creating…" : "Let's Go' →"}
              </Btn>
            </div>
          </div>
        )}

        {/* Toggle row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: "30px", gap: 12 }}>
          <span style={{ fontSize: 14, color: MUTED, whiteSpace: "nowrap" }}>
            {showHost ? "Or Want to join an existing group?" : "Or Are you the DJ for your group?"}
          </span>
          <Btn
            variant="ghost"
            onClick={() => { setShowHost(h => !h); setHostError(null); }}
          >
            {showHost ? "Join" : "Host"}
          </Btn>
        </div>

        </div>



        
      </main>

      {/* ── Learn More modal ── */}
      {showInfo && (
        <div
          onClick={() => setShowInfo(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(15,15,15,0.75)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "32px 36px",
              maxWidth: 400,
              width: "90%",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.12em", marginBottom: 18 }}>
              WHAT IS NERO PARTY?
            </div>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 12 }}>
              A real-time DJ battle where your whole group votes on the queue.
            </p>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 12 }}>
              The <span style={{ color: GREEN, fontWeight: 600 }}>host</span> controls playback. Guests add songs and rate what's played. Highest-rated song wins.
            </p>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>
              Join an open party from the list, or host your own and share the join code.
            </p>
            <Btn fullWidth onClick={() => setShowInfo(false)} style={{ marginTop: 24, borderRadius: 12 }}>
              Got it
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
