import { useState } from "react";

// TODO: migrate localStorage persistence to SQLite when backend schema is set up.
// Schema hint: parties(id, host_name, group_name, is_private, codeword, vibe, created_at)

const inputStyle = {
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 13,
  color: "#111",
  outline: "none",
  fontFamily: "inherit",
};

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
  fontSize: 13,
  color: "#222",
  marginBottom: 8,
};

const labelStyle = {
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export default function HostForm({ onSubmit }) {
  const [name,      setName]      = useState("");
  const [group,     setGroup]     = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [codeword,  setCodeword]  = useState("");
  const [vibe,      setVibe]      = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !group.trim()) return;

    const data = {
      hostName:  name.trim(),
      groupName: group.trim(),
      isPrivate,
      codeword:  isPrivate ? codeword.trim() : null,
      vibe:      vibe.trim() || null,
      createdAt: Date.now(),
    };

    localStorage.setItem("nero_party_host", JSON.stringify(data));
    onSubmit(data);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>

      {/* My name is... */}
      <div style={rowStyle}>
        <span style={labelStyle}>My name is</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          style={{ ...inputStyle, width: 130 }}
          autoFocus
        />
      </div>

      {/* Group name + privacy toggle */}
      <div style={{ ...rowStyle, marginBottom: 4 }}>
        <span style={labelStyle}>and my group is called</span>
      </div>
      <div style={{ ...rowStyle }}>
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="group name"
          style={{ ...inputStyle, width: 130 }}
        />
        <button
          onClick={() => setIsPrivate((v) => !v)}
          title={isPrivate ? "Private" : "Public"}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            padding: "0 2px",
            lineHeight: 1,
          }}
        >
          {isPrivate ? "🔒" : "🔓"}
        </button>
        <span style={{ fontSize: 12, color: "#555" }}>
          {isPrivate ? "private" : "public"}
        </span>
      </div>

      {/* Codeword — only if private */}
      {isPrivate && (
        <div style={rowStyle}>
          <span style={labelStyle}>the codeword is</span>
          <input
            type="password"
            value={codeword}
            onChange={(e) => setCodeword(e.target.value)}
            placeholder="secret word"
            style={{ ...inputStyle, width: 120 }}
          />
        </div>
      )}

      {/* Vibe */}
      <div style={rowStyle}>
        <span style={labelStyle}>and our vibe</span>
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="optional"
          style={{ ...inputStyle, width: 150 }}
        />
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !group.trim()}
          style={{
            background: name.trim() && group.trim() ? "#111" : "#aaa",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            cursor: name.trim() && group.trim() ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          Let us in →
        </button>
      </div>
    </div>
  );
}
