import ShortcutDisplay from "./ShortcutDisplay";

interface StatusBarProps {
  mode: string;
  copied: boolean;
  onCopyClick: () => void;
  theme: "dark" | "light";
}

const modeColors: Record<string, string> = {
  NORMAL: "#a78bfa",
  INSERT: "#34d399",
  VISUAL: "#fbbf24",
  "V-LINE": "#fb923c",
  "V-BLOCK": "#f87171",
};

export default function StatusBar({ mode, copied, onCopyClick, theme }: StatusBarProps) {
  const modeColor = modeColors[mode] || "#a78bfa";
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        appText: "rgba(255, 255, 255, 0.5)",
        hintText: "rgba(255, 255, 255, 0.3)",
        buttonBg: "rgba(255, 255, 255, 0.08)",
        buttonBgHover: "rgba(255, 255, 255, 0.14)",
        buttonText: "rgba(255, 255, 255, 0.72)",
        buttonTextHover: "#ffffff",
        kbdBg: "rgba(255, 255, 255, 0.09)",
        kbdBorder: "1px solid rgba(255, 255, 255, 0.12)",
        kbdText: "rgba(255, 255, 255, 0.46)",
      }
    : {
        background: "rgba(255, 255, 255, 0.08)",
        border: "1px solid rgba(255, 255, 255, 0.34)",
        appText: "rgba(17, 24, 39, 0.48)",
        hintText: "rgba(17, 24, 39, 0.32)",
        buttonBg: "rgba(99, 102, 241, 0.18)",
        buttonBgHover: "rgba(99, 102, 241, 0.28)",
        buttonText: "rgba(67, 56, 202, 0.88)",
        buttonTextHover: "rgba(67, 56, 202, 1)",
        kbdBg: "rgba(255, 255, 255, 0.24)",
        kbdBorder: "1px solid rgba(255, 255, 255, 0.42)",
        kbdText: "rgba(17, 24, 39, 0.44)",
      };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: "40px",
        backgroundColor: colors.background,
        borderTop: colors.border,
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
            color: colors.appText,
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
            color: colors.hintText,
            fontSize: "11px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>:w copy · :q hide ·</span>
          <ShortcutDisplay
            shortcut="⌘ ⇧ C"
            color={colors.hintText}
            fontSize="11px"
          />
          <span>clear</span>
        </span>
        <button
          onClick={onCopyClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "5px",
            border: colors.kbdBorder,
            backgroundColor: copied
              ? "rgba(52, 211, 153, 0.15)"
              : colors.buttonBg,
            color: copied ? "#34d399" : colors.buttonText,
            fontSize: "11px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            cursor: "pointer",
            transition: "all 0.15s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = colors.buttonBgHover;
              e.currentTarget.style.color = colors.buttonTextHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.backgroundColor = colors.buttonBg;
              e.currentTarget.style.color = colors.buttonText;
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
                backgroundColor: colors.kbdBg,
                border: colors.kbdBorder,
                color: colors.kbdText,
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
