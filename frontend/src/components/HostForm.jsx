import { useState } from "react";

// TODO: migrate localStorage to SQLite when backend schema is ready.
// Schema: parties(id, host_name, group_name, is_private, codeword, vibe, created_at)

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
  fontSize: 13,
  color: "#222",
  marginBottom: 8,
};

const labelStyle = { fontWeight: 600, whiteSpace: "nowrap" };

// ── Pill toggle: Public / Private ─────────────────────────────────────────────
function PrivacyToggle({ value, onChange }) {
  const GREEN = "rgba(34,197,94,0.85)";

  return (
    <div style={{
      display: "inline-flex",
      background: GREEN,
      borderRadius: 20,
      padding: 2,
      gap: 0,
      userSelect: "none",
    }}>
      {[{ label: "public 🔓", val: false }, { label: "private 🔒", val: true }].map(({ label, val }) => {
        const active = val === value;
        return (
          <button
            key={label}
            onClick={() => onChange(val)}
            style={{
              background: active ? "#fff" : "transparent",
              color:      active ? "#111" : "rgba(0,0,0,0.6)",
              border: "none",
              borderRadius: 18,
              padding: "3px 12px",
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Name input — exported so DialogSequence can pass it as textInput prop ─────
export function NameInput({ value, onChange }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="your name"
      autoFocus
      style={{ ...inputStyle, width: 120 }}
    />
  );
}

// ── Main form (group + privacy + codeword + vibe + submit) ────────────────────
export default function HostForm({ name, onSubmit }) {
  const [group,     setGroup]     = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [codeword,  setCodeword]  = useState("");
  const [vibe,      setVibe]      = useState("");

  const canSubmit = name.trim() && group.trim();

  const handleSubmit = () => {
    if (!canSubmit) return;
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

      {/* called: [group name] */}
      <div style={rowStyle}>
        <span style={labelStyle}>called:</span>
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="group name"
          style={{ ...inputStyle, width: 130 }}
        />
      </div>

      {/* it's: [public | private] */}
      <div style={rowStyle}>
        <span style={labelStyle}>it's:</span>
        <PrivacyToggle value={isPrivate} onChange={setIsPrivate} />
      </div>

      {/* codeword — private only */}
      {isPrivate && (
        <div style={rowStyle}>
          <span style={labelStyle}>the codeword is:</span>
          <input
            type="password"
            value={codeword}
            onChange={(e) => setCodeword(e.target.value)}
            placeholder="secret word"
            style={{ ...inputStyle, width: 110 }}
          />
        </div>
      )}

      {/* vibe */}
      <div style={rowStyle}>
        <span style={labelStyle}>and our vibe:</span>
        <input
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="optional"
          style={{ ...inputStyle, width: 140 }}
        />
      </div>

      {/* submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? "#111" : "#bbb",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "6px 18px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "background 0.2s",
          }}
        >
          Let us in →
        </button>
      </div>
    </div>
  );
}
