import { useEffect } from "react";

interface HelpModalProps {
  theme: "dark" | "light";
  shortcutDisplay: string;
  onClose: () => void;
}

function getAppShortcuts(shortcutDisplay: string) {
  return [
    { keys: shortcutDisplay, desc: "Toggle window" },
    { keys: "⌘ Enter", desc: "Copy all" },
    { keys: "⌘ ⇧ C", desc: "Clear editor" },
    { keys: "⌘ W", desc: "Hide window" },
  ];
}

const VIM_COMMANDS = [
  { keys: ":w", desc: "Copy content" },
  { keys: ":q", desc: "Hide window" },
  { keys: ":wq", desc: "Copy & hide" },
  { keys: ":h", desc: "History" },
  { keys: ":set ft=X", desc: "Set language" },
];

export default function HelpModal({ theme, shortcutDisplay, onClose }: HelpModalProps) {
  const appShortcuts = getAppShortcuts(shortcutDisplay);
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        overlay: "rgba(0, 0, 0, 0.6)",
        bg: "rgba(39, 39, 42, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        title: "#e4e4e7",
        text: "rgba(255, 255, 255, 0.72)",
        muted: "rgba(255, 255, 255, 0.32)",
        kbdBg: "rgba(255, 255, 255, 0.08)",
        kbdBorder: "1px solid rgba(255, 255, 255, 0.12)",
        kbdText: "rgba(255, 255, 255, 0.8)",
        sectionTitle: "rgba(255, 255, 255, 0.46)",
      }
    : {
        overlay: "rgba(24, 24, 27, 0.2)",
        bg: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(24, 24, 27, 0.08)",
        title: "#1c1917",
        text: "rgba(17, 24, 39, 0.72)",
        muted: "rgba(17, 24, 39, 0.34)",
        kbdBg: "rgba(24, 24, 27, 0.06)",
        kbdBorder: "1px solid rgba(24, 24, 27, 0.1)",
        kbdText: "rgba(17, 24, 39, 0.8)",
        sectionTitle: "rgba(17, 24, 39, 0.44)",
      };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const kbdStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: "4px",
    backgroundColor: colors.kbdBg,
    border: colors.kbdBorder,
    color: colors.kbdText,
    fontSize: "11px",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontWeight: 500,
    lineHeight: "18px",
  };

  const renderSection = (title: string, items: { keys: string; desc: string }[]) => (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: "10px",
        fontWeight: 600,
        color: colors.sectionTitle,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item) => (
          <div key={item.keys} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}>
            <span style={kbdStyle}>{item.keys}</span>
            <span style={{
              fontSize: "11px",
              color: colors.text,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.overlay,
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        animation: "overlay-in 0.15s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "360px",
          backgroundColor: colors.bg,
          borderRadius: "12px",
          border: colors.border,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          animation: "modal-in 0.2s ease",
        }}
      >
        <div style={{
          padding: "12px 16px 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: colors.title,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          borderBottom: colors.border,
        }}>
          Keyboard Shortcuts
        </div>
        <div style={{
          padding: "14px 16px",
          display: "flex",
          gap: "20px",
        }}>
          {renderSection("App", appShortcuts)}
          {renderSection("Vim", VIM_COMMANDS)}
        </div>
        <div style={{
          padding: "6px 16px 8px",
          fontSize: "10px",
          color: colors.muted,
          fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          borderTop: colors.border,
          textAlign: "center",
        }}>
          Press ? or Esc to close
        </div>
      </div>
    </div>
  );
}
