import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParty } from "../../context/PartyContext";

// ── PhoneTab ──────────────────────────────────────────────────────────────────

function PhoneTab({ unread, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width:         56,
        background:    "#1a1a2e",
        border:        "1.5px solid rgba(255,255,255,0.2)",
        borderRight:   "none",
        borderRadius:  "8px 0 0 8px",
        cursor:        "pointer",
        padding:       "10px 8px",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           6,
        userSelect:    "none",
        position:      "relative",
        boxShadow:     "-3px 0 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* smartphone silhouette */}
      <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
        <rect x="1" y="1" width="18" height="28" rx="3.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.5" fill="none"/>
        <rect x="2.5" y="5"  width="15" height="18" rx="1" fill="rgba(255,255,255,0.08)"/>
        <rect x="7"   y="26" width="6"  height="1.5" rx="0.75" fill="rgba(255,255,255,0.45)"/>
        <rect x="8"   y="2.5" width="4" height="1"   rx="0.5"  fill="rgba(255,255,255,0.35)"/>
        {/* signal dots inside screen */}
        <circle cx="7"  cy="14" r="1.2" fill="rgba(255,255,255,0.3)"/>
        <circle cx="10" cy="14" r="1.2" fill="rgba(255,255,255,0.3)"/>
        <circle cx="13" cy="14" r="1.2" fill="rgba(255,255,255,0.3)"/>
      </svg>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily:    "sans-serif",
          fontSize:      7,
          fontWeight:    700,
          letterSpacing: "0.06em",
          color:         "rgba(255,255,255,0.75)",
          lineHeight:    1.3,
        }}>
          GROUP<br/>CHAT
        </div>
      </div>

      {/* unread badge */}
      {unread > 0 && (
        <div style={{
          position:       "absolute",
          top:            6,
          right:          6,
          background:     "#e74c3c",
          color:          "#fff",
          borderRadius:   "50%",
          width:          16,
          height:         16,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       8,
          fontWeight:     700,
          fontFamily:     "sans-serif",
        }}>
          {unread > 9 ? "9+" : unread}
        </div>
      )}
    </div>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ message, isOwn }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    isOwn ? "flex-start" : "flex-end",
      marginBottom:  8,
      padding:       "0 12px",
    }}>
      <div style={{
        fontSize:    9,
        fontFamily:  "sans-serif",
        color:       "rgba(255,255,255,0.38)",
        marginBottom: 2,
        marginLeft:  isOwn ? 2 : 0,
        marginRight: isOwn ? 0 : 2,
      }}>
        {message.displayName}
      </div>
      <div style={{
        maxWidth:     "76%",
        padding:      "7px 12px",
        borderRadius: isOwn
          ? "14px 14px 14px 4px"
          : "14px 14px 4px 14px",
        background: isOwn ? "#2d6a4f" : "#2c2c3e",
        color:      "#fff",
        fontSize:   13,
        fontFamily: "sans-serif",
        lineHeight: 1.45,
        wordBreak:  "break-word",
      }}>
        {message.body}
      </div>
    </div>
  );
}

// ── GroupChat ─────────────────────────────────────────────────────────────────

export default function GroupChat({ messages = [], onSendMessage }) {
  const { participantId, isHost } = useParty();
  const [open,      setOpen]      = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const [input,     setInput]     = useState("");
  const messagesEndRef = useRef(null);

  const unread = Math.max(0, messages.length - seenCount);

  function handleOpen() {
    setOpen(true);
    setSeenCount(messages.length);
  }

  function handleClose() {
    setOpen(false);
    setSeenCount(messages.length);
  }

  // auto-scroll + mark read when open
  useEffect(() => {
    if (open) {
      setSeenCount(messages.length);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return createPortal(
    <>
      {/* overlay — click outside to close */}
      {open && (
        <div
          onClick={handleClose}
          style={{ position: "fixed", inset: 0, zIndex: 19, cursor: "default" }}
        />
      )}

      {/* panel */}
      <div style={{
        position:      "fixed",
        top:           0,
        right:         0,
        width:         "min(320px, 85vw)",
        height:        "100vh",
        zIndex:        20,
        transform:     open ? "translateX(0)" : "translateX(100%)",
        transition:    "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display:       "flex",
        flexDirection: "column",
        background:    "#0f0f1a",
        boxShadow:     "-4px 0 28px rgba(0,0,0,0.65)",
      }}>
        {/* ── header ── */}
        <div style={{
          flexShrink:  0,
          padding:     "14px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background:  "#1a1a2e",
          display:     "flex",
          alignItems:  "center",
          gap:         10,
        }}>
          <svg width="14" height="22" viewBox="0 0 20 30" fill="none">
            <rect x="1" y="1" width="18" height="28" rx="3.5" stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" fill="none"/>
            <rect x="2.5" y="5" width="15" height="18" rx="1" fill="rgba(255,255,255,0.07)"/>
            <rect x="7"   y="26" width="6"  height="1.5" rx="0.75" fill="rgba(255,255,255,0.38)"/>
            <rect x="8"   y="2.5" width="4" height="1"   rx="0.5"  fill="rgba(255,255,255,0.28)"/>
          </svg>

          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily:    "sans-serif",
              fontSize:      12,
              fontWeight:    700,
              letterSpacing: "0.1em",
              color:         "#fff",
            }}>
              GROUPCHAT
            </div>

            <div style={{
              display:    "flex",
              alignItems: "center",
              gap:        5,
              marginTop:  2,
            }}>
              {unread > 0 ? (
                <>
                  <div style={{
                    background:     "#e74c3c",
                    color:          "#fff",
                    borderRadius:   "50%",
                    width:          14,
                    height:         14,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       8,
                    fontWeight:     700,
                    fontFamily:     "sans-serif",
                  }}>
                    {unread > 9 ? "9+" : unread}
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", fontFamily: "sans-serif" }}>
                    unread
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontFamily: "sans-serif" }}>
                  {messages.length} {messages.length === 1 ? "message" : "messages"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── messages ── */}
        <div style={{
          flex:          1,
          overflowY:     "auto",
          padding:       "12px 0",
          display:       "flex",
          flexDirection: "column",
        }}>
          {messages.length === 0 ? (
            <div style={{
              flex:           1,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              color:          "rgba(255,255,255,0.18)",
              fontFamily:     "sans-serif",
              fontSize:       13,
              textAlign:      "center",
              padding:        24,
            }}>
              No messages yet.<br/>Say something!
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.participantId === participantId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── input ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink:  0,
            padding:     "10px 12px",
            borderTop:   "1px solid rgba(255,255,255,0.08)",
            background:  "#1a1a2e",
            display:     "flex",
            gap:         8,
            alignItems:  "center",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            style={{
              flex:         1,
              background:   "rgba(255,255,255,0.07)",
              border:       "1px solid rgba(255,255,255,0.14)",
              borderRadius: 20,
              padding:      "8px 14px",
              color:        "#fff",
              fontFamily:   "sans-serif",
              fontSize:     13,
              outline:      "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width:          36,
              height:         36,
              borderRadius:   "50%",
              background:     input.trim() ? "#2d6a4f" : "rgba(255,255,255,0.07)",
              border:         "none",
              cursor:         input.trim() ? "pointer" : "default",
              color:          input.trim() ? "#fff" : "rgba(255,255,255,0.2)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              transition:     "background 0.15s",
            }}
          >
            {/* send arrow */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* tab — shown only when panel is closed */}
      {!open && (
        <div style={{
          position:  "fixed",
          right:     0,
          top:       isHost ? "10%" : "50%",
          transform: isHost ? "none" : "translateY(-50%)",
          zIndex:    15,
        }}>
          <PhoneTab unread={unread} onClick={handleOpen} />
        </div>
      )}
    </>,
    document.body
  );
}
