export function inputStyle(focused = false) {
  return {
    width:        "100%",
    background:   "rgba(255,255,255,0.08)",
    border:       `1px solid ${focused ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)"}`,
    borderRadius: 8,
    padding:      "8px 12px",
    fontSize:     13,
    color:        "#fff",
    outline:      "none",
    fontFamily:   "inherit",
    boxSizing:    "border-box",
    transition:   "border-color 0.2s",
  };
}
