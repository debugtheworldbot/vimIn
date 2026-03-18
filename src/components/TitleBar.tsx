interface TitleBarProps {
  onClose: () => void;
  onSettingsClick: () => void;
  shortcutDisplay: string;
}

export default function TitleBar({ onClose, onSettingsClick, shortcutDisplay }: TitleBarProps) {
  return (
    <div
      data-tauri-drag-region
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        height: "32px",
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
        flexShrink: 0,
      }}
    >
      {/* Left: close button (macOS style) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={onClose}
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: "#f87171",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          title="Hide (Esc)"
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
        />
      </div>

      {/* Center: title */}
      <span
        data-tauri-drag-region
        style={{
          color: "#71717a",
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          letterSpacing: "0.3px",
        }}
      >
        VimInput
      </span>

      {/* Right: shortcut hint + settings gear */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            color: "#3f3f46",
            fontSize: "10px",
            fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          }}
        >
          {shortcutDisplay}
        </span>
        <button
          onClick={onSettingsClick}
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#52525b",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#a1a1aa";
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#52525b";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Settings"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </div>
  );
}
