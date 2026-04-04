import { useEffect, useState } from "react";

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  padding: "6px 0",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
};

export default function JoinForm({ name, onJoin }) {
  const [parties,      setParties]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [expandedCode, setExpandedCode] = useState(null); // joinCode with open codeword input
  const [codeword,     setCodeword]     = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/parties")
      .then((r) => r.json())
      .then((data) => { setParties(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (party, pw = "") => {
    if (!name.trim()) { setError("Enter your name first"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/parties/${party.joinCode}/join`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim(), codeword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join");
      onJoin({ ...data.party, participantId: data.participantId });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>Looking for parties...</div>;
  }

  if (!parties.length) {
    return <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>No open parties right now.</div>;
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.08em", marginBottom: 4 }}>
        GUEST LIST
      </div>

      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {parties.map((party) => {
          const isExpanded = expandedCode === party.joinCode;
          return (
            <div key={party.joinCode}>
              <div style={rowStyle}>
                {/* name */}
                <span style={{ fontWeight: 700, fontSize: 13, flex: "0 0 auto", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {party.groupName}
                </span>

                {/* lock */}
                <span style={{ fontSize: 13, flex: "0 0 auto" }}>
                  {party.isPrivate ? "🔒" : "🔓"}
                </span>

                {/* vibe */}
                <span style={{ fontSize: 11, color: "#666", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {party.vibe || "—"}
                </span>

                {/* count */}
                <span style={{ fontSize: 11, color: "#888", flex: "0 0 auto", whiteSpace: "nowrap" }}>
                  {party._count.participants} in
                </span>

                {/* join button */}
                <button
                  onClick={() => {
                    if (party.isPrivate) {
                      setExpandedCode(isExpanded ? null : party.joinCode);
                      setCodeword("");
                      setError(null);
                    } else {
                      handleJoin(party);
                    }
                  }}
                  disabled={submitting}
                  style={{
                    flex: "0 0 auto",
                    fontSize: 11,
                    fontWeight: 700,
                    background: "#111",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "3px 10px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  join
                </button>
              </div>

              {/* inline codeword input for private parties */}
              {isExpanded && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 0 6px 0" }}>
                  <input
                    autoFocus
                    type="password"
                    value={codeword}
                    onChange={(e) => setCodeword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin(party, codeword)}
                    placeholder="codeword"
                    style={{
                      fontSize: 12,
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid #ccc",
                      outline: "none",
                      flex: 1,
                    }}
                  />
                  <button
                    onClick={() => handleJoin(party, codeword)}
                    disabled={submitting || !codeword.trim()}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: codeword.trim() ? "#111" : "#bbb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "3px 10px",
                      cursor: codeword.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    enter
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{ fontSize: 11, color: "#c00", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}
