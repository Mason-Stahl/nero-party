import { useState, useEffect, useRef } from "react";
import { useParty } from "../context/PartyContext";

const DEBOUNCE_MS = 300;

function isYouTubeUrl(str) {
  try {
    const u = new URL(str);
    return u.hostname === "youtu.be" ||
      (u.hostname.includes("youtube.com") && u.searchParams.has("v"));
  } catch {
    return false;
  }
}

// Deterministic color from artist name for the avatar placeholder
function artistColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 38%)`;
}

export default function AddSong({ onAdded, partyEnded = false }) {
  const { partyId, participantId } = useParty();
  const [query,         setQuery]         = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null); // { name, artist }
  const [suggestions,   setSuggestions]   = useState([]);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [searching,     setSearching]     = useState(false);
  const [focused,       setFocused]       = useState(false);
  const [error,         setError]         = useState(null);
  const timerRef  = useRef(null);
  const wrapRef   = useRef(null);
  const lockedRef = useRef(false); // true after selection until user edits

  const isUrl     = isYouTubeUrl(query.trim());
  const canSubmit = !loading && !partyEnded && (!!selectedTrack || isUrl);

  // Debounced LastFM search — skips if query looks like a YouTube URL
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isUrl || !query.trim() || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      if (lockedRef.current) return;
      setSearching(true);
      try {
        const res  = await fetch(`http://localhost:3000/search/tracks?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const results = Array.isArray(data) ? data : [];
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (track) => {
    setQuery(`${track.name} — ${track.artist}`);
    setSelectedTrack(track);
    setSuggestions([]);
    setOpen(false);
    setError(null);
    lockedRef.current = true;
  };

  const handleQueryChange = (e) => {
    lockedRef.current = false;
    setQuery(e.target.value);
    setSelectedTrack(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const body = isUrl
        ? { youtubeUrl: query.trim(), participantId }
        : { title: selectedTrack.name, artist: selectedTrack.artist, participantId };

      const res = await fetch(`http://localhost:3000/parties/${partyId}/songs`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add song");

      setQuery("");
      setSelectedTrack(null);
      setSuggestions([]);
      onAdded?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (partyEnded) {
    return (
      <div style={{
        fontSize: 11, color: "rgba(255,255,255,0.3)",
        fontStyle: "italic", padding: "4px 0",
      }}>
        The party has ended — submissions are closed.
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
      {/* Suggestion dropdown — above the input */}
      {open && suggestions.length > 0 && (
        <div style={{
          position:     "absolute",
          bottom:       "calc(100% + 4px)",
          left:         0,
          right:        0,
          background:   "rgba(18,8,36,0.97)",
          border:       "1px solid rgba(167,139,250,0.35)",
          borderRadius: 10,
          overflow:     "hidden",
          zIndex:       200,
          boxShadow:    "0 -4px 24px rgba(0,0,0,0.65)",
        }}>
          {suggestions.map((track, i) => (
            <SuggestionRow
              key={`${track.name}-${track.artist}-${i}`}
              track={track}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={query}
          onChange={handleQueryChange}
          onFocus={() => { setFocused(true); if (!lockedRef.current && suggestions.length) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search songs or paste a YouTube URL…"
          disabled={loading}
          style={{
            flex:         1,
            background:   "rgba(255,255,255,0.08)",
            border:       `1px solid ${focused ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.2)"}`,
            borderRadius: 8,
            padding:      "6px 12px",
            fontSize:     12,
            color:        "#fff",
            outline:      "none",
            fontFamily:   "inherit",
            transition:   "border-color 0.2s",
          }}
        />
        {/* Spinner while searching LastFM */}
        {searching && (
          <span style={{
            alignSelf: "center", fontSize: 10,
            color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap",
          }}>…</span>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background:   canSubmit ? "rgba(34,197,94,0.85)" : "rgba(255,255,255,0.1)",
            color:        canSubmit ? "#000" : "rgba(255,255,255,0.3)",
            border:       "none",
            borderRadius: 8,
            padding:      "6px 14px",
            fontSize:     12,
            fontWeight:   700,
            cursor:       canSubmit ? "pointer" : "not-allowed",
            transition:   "all 0.2s",
            whiteSpace:   "nowrap",
          }}
        >
          {loading ? "…" : "+ Add"}
        </button>
      </div>

      {error && <div style={{ fontSize: 11, color: "#f87171" }}>{error}</div>}
    </div>
  );
}

function SuggestionRow({ track, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const initial = (track.artist || "?")[0].toUpperCase();
  const color   = artistColor(track.artist);

  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); onSelect(track); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:       "flex",
        alignItems:    "center",
        gap:           8,
        padding:       "7px 10px",
        cursor:        "pointer",
        background:    hovered ? "rgba(167,139,250,0.15)" : "transparent",
        transition:    "background 0.1s",
        borderBottom:  "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Artist initial avatar */}
      <div style={{
        width:          28,
        height:         28,
        borderRadius:   5,
        flexShrink:     0,
        background:     color,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       13,
        fontWeight:     700,
        color:          "rgba(255,255,255,0.85)",
        letterSpacing:  0,
      }}>
        {initial}
      </div>

      {/* Track info */}
      <div style={{ overflow: "hidden" }}>
        <div style={{
          fontSize:     12,
          fontWeight:   600,
          color:        "#fff",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
        }}>
          {track.name}
        </div>
        <div style={{
          fontSize:     10,
          color:        "rgba(255,255,255,0.45)",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
        }}>
          {track.artist}
        </div>
      </div>
    </div>
  );
}
