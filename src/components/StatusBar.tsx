interface StatusBarProps {
  mode: string;
  copied: boolean;
  onCopyClick: () => void;
}

const modeColors: Record<string, string> = {
  NORMAL: "#a78bfa",
  INSERT: "#34d399",
  VISUAL: "#fbbf24",
  "V-LINE": "#fb923c",
  "V-BLOCK": "#f87171",
};

export default function StatusBar({ mode, copied, onCopyClick }: StatusBarProps) {
  const modeColor = modeColors[mode] || "#a78bfa";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        height: "36px",
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        userSelect: "none",
        WebkitUserSelect: "none",
        flexShrink: 0,
      }}
    >
      {/* Left: Mode indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 10px",
            borderRadius: "4px",
            backgroundColor: modeColor,
            color: "#18181b",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            letterSpacing: "0.5px",
            transition: "background-color 0.15s ease",
          }}
        >
          {mode}
        </div>
        <span
          style={{
            color: "#71717a",
            fontSize: "11px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          }}
        >
          VimInput
        </span>
      </div>

      {/* Right: Copy button + shortcut hint */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            color: "#52525b",
            fontSize: "11px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          }}
        >
          :w copy · :q hide · :wq both
        </span>
        <button
          onClick={onCopyClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "5px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: copied
              ? "rgba(52, 211, 153, 0.15)"
              : "rgba(255, 255, 255, 0.06)",
            color: copied ? "#34d399" : "#a1a1aa",
            fontSize: "11px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            cursor: "pointer",
            transition: "all 0.15s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.color = "#e4e4e7";
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.color = "#a1a1aa";
            }
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy All
              <kbd style={{
                fontSize: "10px",
                padding: "1px 4px",
                borderRadius: "3px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#71717a",
                marginLeft: "2px",
              }}>
                ⌘⏎
              </kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
