import { useState } from "react";
import Notes from "./Notes";
import AddSong from "./AddSong";

const PAGE = 5;

export default function Queue({ songs = [], partyEnded = false }) {
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? songs : songs.slice(0, PAGE);
  const hasMore = songs.length > PAGE;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
          QUEUE {songs.length > 0 && `· ${songs.length}`}
        </div>
        {hasMore && (
          <button
            onClick={() => setShowAll((s) => !s)}
            style={{
              fontSize: 10, color: "rgba(255,255,255,0.6)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {showAll ? "show less" : `+${songs.length - PAGE} more`}
          </button>
        )}
      </div>

      {/* Staff visualization */}
      {songs.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", paddingBottom: 4 }}>
          No songs yet. Add one below.
        </div>
      ) : (
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <Notes songs={visible} />
        </div>
      )}

      {/* Add song input */}
      <AddSong partyEnded={partyEnded} />
    </div>
  );
}
