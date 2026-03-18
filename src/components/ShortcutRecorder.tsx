import { useState, useEffect, useCallback, useRef } from "react";

interface ShortcutRecorderProps {
  currentShortcut: string; // e.g. "Alt+Space"
  onShortcutChange: (shortcut: string) => void;
  onClose: () => void;
}

// Map browser key event to Tauri-compatible key names
function keyToCode(key: string, code: string): string | null {
  // Letter keys
  if (/^Key([A-Z])$/.test(code)) {
    return code.replace("Key", "");
  }
  // Digit keys
  if (/^Digit(\d)$/.test(code)) {
    return code.replace("Digit", "");
  }
  // Function keys
  if (/^F(\d+)$/.test(key)) {
    return key;
  }
  // Special keys mapping
  const specialMap: Record<string, string> = {
    " ": "Space",
    Space: "Space",
    Enter: "Enter",
    Tab: "Tab",
    Escape: "Escape",
    Backspace: "Backspace",
    Delete: "Delete",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Insert: "Insert",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
  };

  if (specialMap[key]) return specialMap[key];
  if (specialMap[code]) return specialMap[code];

  // Numpad
  if (code.startsWith("Numpad")) {
    return code;
  }

  return null;
}

function formatShortcutDisplay(shortcut: string): string {
  return shortcut
    .replace(/Alt/g, "⌥")
    .replace(/Shift/g, "⇧")
    .replace(/Control/g, "⌃")
    .replace(/Meta/g, "⌘")
    .replace(/Cmd/g, "⌘")
    .replace(/\+/g, " ");
}

export default function ShortcutRecorder({ currentShortcut, onShortcutChange, onClose }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [pendingShortcut, setPendingShortcut] = useState<string | null>(null);
  const recorderRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!recording) return;

    e.preventDefault();
    e.stopPropagation();

    // Ignore standalone modifier keys
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Control");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");
    if (e.metaKey) parts.push("Meta");

    // Must have at least one modifier
    if (parts.length === 0) {
      return;
    }

    const keyCode = keyToCode(e.key, e.code);
    if (!keyCode) return;

    parts.push(keyCode);
    const shortcut = parts.join("+");
    setPendingShortcut(shortcut);
    setRecording(false);
  }, [recording]);

  useEffect(() => {
    if (recording) {
      window.addEventListener("keydown", handleKeyDown, true);
      return () => window.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [recording, handleKeyDown]);

  const handleSave = () => {
    if (pendingShortcut) {
      onShortcutChange(pendingShortcut);
    }
  };

  const handleCancel = () => {
    setPendingShortcut(null);
    setRecording(false);
    onClose();
  };

  const displayShortcut = pendingShortcut || currentShortcut;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        ref={recorderRef}
        style={{
          width: "360px",
          backgroundColor: "rgba(39, 39, 42, 0.98)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}>
          <h3 style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: "#e4e4e7",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}>
            Set Global Shortcut
          </h3>
          <p style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: "#71717a",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}>
            Choose a key combination to toggle VimInput
          </p>
        </div>

        {/* Shortcut display */}
        <div style={{ padding: "20px" }}>
          <div
            onClick={() => setRecording(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "56px",
              borderRadius: "8px",
              border: recording
                ? "2px solid #a78bfa"
                : "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: recording
                ? "rgba(167, 139, 250, 0.08)"
                : "rgba(255, 255, 255, 0.04)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {recording ? (
              <span style={{
                fontSize: "13px",
                color: "#a78bfa",
                fontFamily: "'SF Mono', Menlo, Monaco, monospace",
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                Press your shortcut...
              </span>
            ) : (
              <span style={{
                fontSize: "18px",
                color: "#e4e4e7",
                fontFamily: "'SF Mono', Menlo, Monaco, monospace",
                fontWeight: 500,
                letterSpacing: "2px",
              }}>
                {formatShortcutDisplay(displayShortcut)}
              </span>
            )}
          </div>

          {/* Hint */}
          <p style={{
            margin: "10px 0 0",
            fontSize: "11px",
            color: "#52525b",
            textAlign: "center",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          }}>
            {recording
              ? "Press a modifier (⌘ ⌥ ⌃ ⇧) + key"
              : "Click to record a new shortcut"
            }
          </p>
        </div>

        {/* Footer buttons */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "12px 20px 16px",
          justifyContent: "flex-end",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "transparent",
              color: "#a1a1aa",
              fontSize: "12px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!pendingShortcut}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: pendingShortcut ? "#a78bfa" : "rgba(167, 139, 250, 0.3)",
              color: pendingShortcut ? "#18181b" : "#71717a",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              cursor: pendingShortcut ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (pendingShortcut) {
                e.currentTarget.style.backgroundColor = "#8b5cf6";
              }
            }}
            onMouseLeave={(e) => {
              if (pendingShortcut) {
                e.currentTarget.style.backgroundColor = "#a78bfa";
              }
            }}
          >
            Save
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
