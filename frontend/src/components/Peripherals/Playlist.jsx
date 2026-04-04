export default function Playlist({ songs = [] }) {
  function handleExport() {
    const data = songs.map((s) => ({
      name:    s.title,
      channel: s.artist,
      url:     s.youtubeUrl,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "playlist.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={songs.length === 0}
      title="Export playlist"
      style={{
        padding:      "3px 9px",
        background:   songs.length ? "rgba(0,0,0,0.08)" : "transparent",
        border:       "1px solid rgba(0,0,0,0.18)",
        borderRadius: 4,
        cursor:       songs.length ? "pointer" : "default",
        fontFamily:   "sans-serif",
        fontSize:     9,
        fontWeight:   700,
        letterSpacing: "0.06em",
        color:        songs.length ? "#333" : "rgba(0,0,0,0.25)",
        whiteSpace:   "nowrap",
        transition:   "background 0.15s",
      }}
    >
      EXPORT
    </button>
  );
}
