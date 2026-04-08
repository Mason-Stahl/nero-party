import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParty } from "../../context/PartyContext";

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
        fontSize:     9,
        fontFamily:   "sans-serif",
        color:        "rgba(255,255,255,0.38)",
        marginBottom: 2,
        marginLeft:   isOwn ? 2 : 0,
        marginRight:  isOwn ? 0 : 2,
      }}>
        {message.displayName}
      </div>
      <div style={{
        maxWidth:     "76%",
        padding:      "7px 12px",
        borderRadius: isOwn ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
        background:   isOwn ? "#2d6a4f" : "#2c2c3e",
        color:        "#fff",
        fontSize:     13,
        fontFamily:   "sans-serif",
        lineHeight:   1.45,
        wordBreak:    "break-word",
      }}>
        {message.body}
      </div>
    </div>
  );
}

// ── Shared chat content ────────────────────────────────────────────────────────
// Used by both portal panel and mobile full-page.

function ChatContent({ messages, onSendMessage, participantId, scrollOnUpdate }) {
  const [input, setInput]   = useState("");
  const messagesEndRef      = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, scrollOnUpdate]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      {/* Header */}
      <div style={{
        flexShrink:   0,
        padding:      "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background:   "#1a1a2e",
        display:      "flex",
        alignItems:   "center",
        gap:          10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.6)" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <div style={{
          fontFamily: "sans-serif", fontSize: 12,
          fontWeight: 700, letterSpacing: "0.1em", color: "#fff",
        }}>
          GROUP CHAT
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 0",
        display: "flex", flexDirection: "column",
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.18)", fontFamily: "sans-serif",
            fontSize: 13, textAlign: "center", padding: 24,
          }}>
            No messages yet.<br />Say something!
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg}
              isOwn={msg.participantId === participantId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, padding: "10px 12px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "#1a1a2e", display: "flex", gap: 8, alignItems: "center",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message…"
          style={{
            flex: 1, background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 20, padding: "8px 14px",
            color: "#fff", fontFamily: "sans-serif", fontSize: 13, outline: "none",
          }}
        />
        <button onClick={handleSend} disabled={!input.trim()} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: input.trim() ? "#2d6a4f" : "rgba(255,255,255,0.07)",
          border: "none", cursor: input.trim() ? "pointer" : "default",
          color: input.trim() ? "#fff" : "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.15s",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </>
  );
}

// ── GroupChat — desktop: portal slide-out  /  mobile: full-page inline ─────────
// Props: open, onClose, messages, onSendMessage, fullPage

export default function GroupChat({ open, onClose, messages = [], onSendMessage, fullPage = false }) {
  const { participantId } = useParty();

  // Mobile full-page: fills its container directly
  if (fullPage) {
    return (
      <div style={{
        position:      "absolute",
        inset:         0,
        display:       "flex",
        flexDirection: "column",
        background:    "#0f0f1a",
      }}>
        <ChatContent
          messages={messages}
          onSendMessage={onSendMessage}
          participantId={participantId}
          scrollOnUpdate={true}
        />
      </div>
    );
  }

  // Desktop: portal slide-out from right
  return createPortal(
    <>
      {open && (
        <div onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 19, cursor: "default" }} />
      )}
      <div style={{
        position:      "fixed",
        top:           0, right: 0,
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
        <ChatContent
          messages={messages}
          onSendMessage={onSendMessage}
          participantId={participantId}
          scrollOnUpdate={open}
        />
      </div>
    </>,
    document.body
  );
}
