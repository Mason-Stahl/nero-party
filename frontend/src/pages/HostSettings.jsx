import { useState } from "react";
import { useParty } from "../context/PartyContext";
import Btn from "../components/Btn";

const MUTED = "rgba(255,255,255,0.45)";

const NAV_ITEMS = [
  { id: "invite",         label: "Invite" },
  { id: "manage-queue",   label: "Manage Queue" },
  { id: "queue-settings", label: "Queue Settings" },
  { id: "manage-song",    label: "Manage Song" },
  { id: "manage-people",  label: "Manage People" },
];

function InvitePanel() {
  const { joinCode, groupName } = useParty();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const joinLink = `${window.location.origin}/join/${joinCode}`;
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", marginBottom: 18 }}>
        INVITE TO {groupName?.toUpperCase()}
      </div>

      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
        Share this code or link with your crew so they can join the party.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.18em",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.14)",
          color: "#fff",
          borderRadius: 10,
          padding: "8px 18px",
        }}>
          {joinCode}
        </div>
        <Btn
          size="sm"
          variant={copied ? "primary" : "ghost"}
          onClick={handleCopy}
          style={{ borderRadius: 10, whiteSpace: "nowrap" }}
        >
          {copied ? "copied!" : "copy link"}
        </Btn>
      </div>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", marginTop: 8 }}>
        {window.location.origin}/join/{joinCode}
      </p>
    </div>
  );
}

function PlaceholderPanel({ title }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", marginBottom: 18 }}>
        {title.toUpperCase()}
      </div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>Coming soon.</p>
    </div>
  );
}

export default function HostSettings({ onGoToStage }) {
  const [active, setActive] = useState("invite");

  const renderContent = () => {
    switch (active) {
      case "invite":          return <InvitePanel />;
      case "manage-queue":    return <PlaceholderPanel title="Manage Queue" />;
      case "queue-settings":  return <PlaceholderPanel title="Queue Settings" />;
      case "manage-song":     return <PlaceholderPanel title="Manage Song" />;
      case "manage-people":   return <PlaceholderPanel title="Manage People" />;
      default:                return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "inherit",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 64,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        position: "relative",
        padding: "0 24px",
        background: "rgba(10,10,10,0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Host Settings
        </span>
        <button
          onClick={onGoToStage}
          title="Go to stage"
          style={{
            position: "absolute",
            right: 24,
            background: "none",
            border: "none",
            color: MUTED,
            fontSize: 22,
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          ✕
        </button>
      </nav>

      {/* Body */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: 200,
          flexShrink: 0,
          borderRight: "1px solid rgba(255,255,255,0.07)",
          padding: "24px 0",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  background: isActive ? "rgba(255,255,255,0.06)" : "none",
                  border: "none",
                  borderLeft: isActive
                    ? "2px solid rgba(74,222,128,0.8)"
                    : "2px solid transparent",
                  color: isActive ? "#fff" : MUTED,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  padding: "11px 24px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  width: "100%",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
