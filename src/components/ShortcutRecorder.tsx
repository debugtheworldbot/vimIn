import { useState, useEffect, useCallback, useRef } from "react";
import ShortcutDisplay from "./ShortcutDisplay";

interface ShortcutRecorderProps {
  currentShortcut: string; // e.g. "Alt+Space"
  onShortcutChange: (shortcut: string) => void;
  visibilitySettings: {
    hide_menu_bar_icon: boolean;
  };
  onVisibilitySettingsChange: (settings: {
    hide_menu_bar_icon: boolean;
  }) => void;
  onClose: () => void;
  theme: "dark" | "light";
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

export default function ShortcutRecorder({
  currentShortcut,
  onShortcutChange,
  visibilitySettings,
  onVisibilitySettingsChange,
  onClose,
  theme,
}: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [pendingShortcut, setPendingShortcut] = useState<string | null>(null);
  const recorderRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        overlay: "rgba(0, 0, 0, 0.6)",
        modal: "rgba(39, 39, 42, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        subtleBorder: "1px solid rgba(255, 255, 255, 0.06)",
        title: "#e4e4e7",
        body: "#71717a",
        displayBorder: "1px solid rgba(255, 255, 255, 0.12)",
        displayBg: "rgba(255, 255, 255, 0.04)",
        text: "#e4e4e7",
        muted: "#52525b",
        buttonBorder: "1px solid rgba(255, 255, 255, 0.1)",
        buttonText: "#a1a1aa",
        buttonHover: "rgba(255, 255, 255, 0.06)",
      }
    : {
        overlay: "rgba(24, 24, 27, 0.2)",
        modal: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(24, 24, 27, 0.08)",
        subtleBorder: "1px solid rgba(24, 24, 27, 0.08)",
        title: "#1c1917",
        body: "#78716c",
        displayBorder: "1px solid rgba(24, 24, 27, 0.12)",
        displayBg: "rgba(24, 24, 27, 0.03)",
        text: "#292524",
        muted: "#a8a29e",
        buttonBorder: "1px solid rgba(24, 24, 27, 0.1)",
        buttonText: "#57534e",
        buttonHover: "rgba(24, 24, 27, 0.06)",
      };

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
      return;
    }

    onClose();
  };

  const handleCancel = () => {
    setPendingShortcut(null);
    setRecording(false);
    onClose();
  };

  const handleMenuBarIconChange = (checked: boolean) => {
    void onVisibilitySettingsChange({
      hide_menu_bar_icon: checked,
    });
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
        backgroundColor: colors.overlay,
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
          width: "400px",
          backgroundColor: colors.modal,
          borderRadius: "12px",
          border: colors.border,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px 12px",
          borderBottom: colors.subtleBorder,
        }}>
          <h3 style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 600,
            color: colors.title,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}>
            Set Global Shortcut
          </h3>
          <p style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: colors.body,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          }}>
            Configure how VimInput is shown and how it stays accessible
          </p>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{
            marginBottom: "18px",
          }}>
            <div style={{
              marginBottom: "10px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.body,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}>
              Global Shortcut
            </div>
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
                : colors.displayBorder,
              backgroundColor: recording
                ? "rgba(167, 139, 250, 0.08)"
                : colors.displayBg,
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
              <ShortcutDisplay
                shortcut={formatShortcutDisplay(displayShortcut)}
                color={colors.text}
                fontSize="18px"
                fontWeight={500}
                letterSpacing="2px"
              />
            )}
          </div>
          </div>

          <p style={{
            margin: "10px 0 0",
            fontSize: "11px",
            color: colors.muted,
            textAlign: "center",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          }}>
            {recording
              ? "Press a modifier (⌘ ⌥ ⌃ ⇧) + key"
              : "Click to record a new shortcut"
            }
          </p>

          <div style={{
            marginTop: "20px",
            paddingTop: "18px",
            borderTop: colors.subtleBorder,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            <div style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: colors.body,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}>
              Visibility
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: colors.displayBorder,
                backgroundColor: colors.displayBg,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <input
                type="checkbox"
                checked={visibilitySettings.hide_menu_bar_icon}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  handleMenuBarIconChange(e.currentTarget.checked);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#2563eb",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{
                  fontSize: "13px",
                  color: colors.text,
                  fontWeight: 500,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                }}>
                  Hide menu bar icon
                </span>
                <span style={{
                  fontSize: "11px",
                  color: colors.body,
                  lineHeight: 1.45,
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                }}>
                  Remove the status bar icon from the macOS menu bar.
                </span>
              </div>
            </label>

            <p style={{
              margin: 0,
              fontSize: "11px",
              color: colors.body,
              lineHeight: 1.5,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}>
              Dock icon stays hidden. You can still show VimInput with the global shortcut.
            </p>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "12px 20px 16px",
          justifyContent: "flex-end",
          borderTop: colors.subtleBorder,
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: colors.buttonBorder,
              backgroundColor: "transparent",
              color: colors.buttonText,
              fontSize: "12px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.buttonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#a78bfa",
              color: "#18181b",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#8b5cf6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#a78bfa";
            }}
          >
            {pendingShortcut ? "Save" : "Done"}
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
