interface StatusBarProps {
  mode: string;
  onCopyClick: () => void;
  theme: "dark" | "light";
  language: string;
}

const modeColors: Record<string, string> = {
  NORMAL: "#a78bfa",
  INSERT: "#34d399",
  VISUAL: "#fbbf24",
  "V-LINE": "#fb923c",
  "V-BLOCK": "#f87171",
};

export default function StatusBar({ mode, onCopyClick, theme, language }: StatusBarProps) {
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
        transition: "background-color 0.35s ease, border-top 0.35s ease",
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
            transition: "color 0.35s ease",
          }}
        >
          {language}
        </span>
      </div>

      {/* Right: hints + copy */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            color: colors.hintText,
            fontSize: "10px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            transition: "color 0.35s ease",
          }}
        >
          :w copy · :q hide
        </span>
        <button
          onClick={onCopyClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "4px",
            border: colors.kbdBorder,
            backgroundColor: colors.buttonBg,
            color: colors.buttonText,
            fontSize: "10px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            cursor: "pointer",
            transition: "all 0.15s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonBgHover;
            e.currentTarget.style.color = colors.buttonTextHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.buttonBg;
            e.currentTarget.style.color = colors.buttonText;
          }}
        >
          ⌘⏎
        </button>
      </div>
    </div>
  );
}
