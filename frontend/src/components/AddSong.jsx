import { useState } from "react";

export default function AddSong({ partyId, participantId, onAdded }) {
  const [url,       setUrl]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const canSubmit = url.trim() && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:3000/parties/${partyId}/songs`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: url.trim(), participantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add song");
      setUrl("");
      onAdded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Paste a YouTube URL..."
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            color: "#fff",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.1)",
            color:      canSubmit ? "#000" : "rgba(255,255,255,0.3)",
            border: "none",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "..." : "+ Add"}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "#f87171" }}>{error}</div>}
    </div>
  );
}
