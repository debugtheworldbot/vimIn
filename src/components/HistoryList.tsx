import { useState, useEffect, useCallback } from "react";

interface HistoryEntry {
  content: string;
  timestamp: number;
}

interface HistoryListProps {
  theme: "dark" | "light";
  onSelect: (content: string) => void;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncate(text: string, max: number): string {
  const firstLine = text.split("\n")[0] || "";
  return firstLine.length > max ? firstLine.slice(0, max) + "..." : firstLine;
}

export default function HistoryList({ theme, onSelect, onClose }: HistoryListProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const isDark = theme === "dark";

  const colors = isDark
    ? {
        overlay: "rgba(0, 0, 0, 0.6)",
        bg: "rgba(39, 39, 42, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        title: "#e4e4e7",
        text: "rgba(255, 255, 255, 0.72)",
        muted: "rgba(255, 255, 255, 0.32)",
        selectedBg: "rgba(167, 139, 250, 0.15)",
        hoverBg: "rgba(255, 255, 255, 0.04)",
        emptyText: "rgba(255, 255, 255, 0.3)",
      }
    : {
        overlay: "rgba(24, 24, 27, 0.2)",
        bg: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(24, 24, 27, 0.08)",
        title: "#1c1917",
        text: "rgba(17, 24, 39, 0.72)",
        muted: "rgba(17, 24, 39, 0.34)",
        selectedBg: "rgba(99, 102, 241, 0.12)",
        hoverBg: "rgba(24, 24, 27, 0.03)",
        emptyText: "rgba(17, 24, 39, 0.3)",
      };

  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const history = await invoke<HistoryEntry[]>("get_history");
        setEntries(history);
      } catch {
        setEntries([]);
      }
    })();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "j" || e.key === "ArrowDown") {
      setSelectedIndex((i) => Math.min(i + 1, entries.length - 1));
    } else if (e.key === "k" || e.key === "ArrowUp") {
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (entries[selectedIndex]) {
        onSelect(entries[selectedIndex].content);
      }
    } else if (e.key === "Escape" || e.key === "q") {
      onClose();
    }
  }, [entries, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

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
          width: "380px",
          maxHeight: "320px",
          backgroundColor: colors.bg,
          borderRadius: "10px",
          border: colors.border,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "modal-in 0.2s ease",
        }}
      >
        <div style={{
          padding: "10px 14px",
          fontSize: "12px",
          fontWeight: 600,
          color: colors.title,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          borderBottom: colors.border,
          flexShrink: 0,
        }}>
          History ({entries.length})
        </div>

        <div style={{
          overflowY: "auto",
          flex: 1,
        }}>
          {entries.length === 0 ? (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: colors.emptyText,
              fontSize: "12px",
              fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            }}>
              No history yet
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={entry.timestamp + "-" + index}
                onClick={() => onSelect(entry.content)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 14px",
                  cursor: "pointer",
                  backgroundColor: index === selectedIndex ? colors.selectedBg : "transparent",
                  borderLeft: index === selectedIndex ? "2px solid #a78bfa" : "2px solid transparent",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={() => {
                  setSelectedIndex(index);
                }}
              >
                <span style={{
                  fontSize: "12px",
                  color: colors.text,
                  fontFamily: "'SF Mono', Menlo, Monaco, monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                  marginRight: "12px",
                }}>
                  {truncate(entry.content, 60)}
                </span>
                <span style={{
                  fontSize: "10px",
                  color: colors.muted,
                  fontFamily: "'SF Mono', Menlo, Monaco, monospace",
                  flexShrink: 0,
                }}>
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{
          padding: "6px 14px",
          fontSize: "10px",
          color: colors.muted,
          fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          borderTop: colors.border,
          flexShrink: 0,
        }}>
          j/k navigate · Enter restore · Esc close
        </div>
      </div>
    </div>
  );
}
