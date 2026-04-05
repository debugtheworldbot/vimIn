import { useState, type MouseEvent as ReactMouseEvent } from "react";
import ShortcutDisplay from "./ShortcutDisplay";

interface TitleBarProps {
  onClose: () => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
  shortcutDisplay: string;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function TitleBar({
  onClose,
  onSettingsClick,
  onHelpClick,
  shortcutDisplay,
  theme,
  onThemeToggle,
}: TitleBarProps) {
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        title: "rgba(255, 255, 255, 0.56)",
        shortcut: "rgba(255, 255, 255, 0.32)",
        icon: "rgba(255, 255, 255, 0.42)",
        iconHover: "rgba(255, 255, 255, 0.82)",
        iconHoverBg: "rgba(255, 255, 255, 0.06)",
      }
    : {
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.38)",
        title: "rgba(17, 24, 39, 0.62)",
        shortcut: "rgba(17, 24, 39, 0.34)",
        icon: "rgba(17, 24, 39, 0.46)",
        iconHover: "rgba(17, 24, 39, 0.9)",
        iconHoverBg: "rgba(255, 255, 255, 0.28)",
      };

  const handleDragStart = async (event: ReactMouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) {
      return;
    }

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // Not in Tauri environment
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={(event) => {
        void handleDragStart(event);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: "38px",
        backgroundColor: colors.background,
        borderBottom: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "grab",
        flexShrink: 0,
        transition: "background-color 0.35s ease",
      }}
    >
      <div
        data-tauri-drag-region
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <button
          data-tauri-no-drag
          onClick={onClose}
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            border: "none",
            backgroundColor: isCloseHovered ? "#ff5f57" : "#ff605c",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.15s ease, transform 0.15s ease",
            transform: isCloseHovered ? "scale(1.02)" : "scale(1)",
          }}
          onMouseEnter={() => {
            setIsCloseHovered(true);
          }}
          onMouseLeave={() => {
            setIsCloseHovered(false);
          }}
          title="Hide (Esc)"
        >
          <svg
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
            style={{
              opacity: isCloseHovered ? 1 : 0,
              transition: "opacity 0.12s ease",
              pointerEvents: "none",
            }}
          >
            <path d="M0.5 0.5L5.5 5.5M5.5 0.5L0.5 5.5" stroke="rgba(80, 16, 12, 0.72)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <span
        data-tauri-drag-region
        style={{
          color: colors.title,
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          letterSpacing: "0.3px",
          transition: "color 0.35s ease",
        }}
      >
        VimInput
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          data-tauri-drag-region
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "22px",
          }}
        >
          <ShortcutDisplay
            shortcut={shortcutDisplay}
            color={colors.shortcut}
            fontSize="10px"
          />
        </span>
        <button
          data-tauri-no-drag
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={onHelpClick}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.icon,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.iconHover;
            e.currentTarget.style.backgroundColor = colors.iconHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.icon;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Keyboard shortcuts (?)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
        <button
          data-tauri-no-drag
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={onThemeToggle}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.icon,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.iconHover;
            e.currentTarget.style.backgroundColor = colors.iconHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.icon;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3c0 4.97 4.03 9 9 9 .27 0 .53-.07.79-.21" />
            </svg>
          )}
        </button>
        <button
          data-tauri-no-drag
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={onSettingsClick}
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colors.icon,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.iconHover;
            e.currentTarget.style.backgroundColor = colors.iconHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.icon;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Settings"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M7 10h.01" />
            <path d="M11 10h.01" />
            <path d="M15 10h.01" />
            <path d="M7 14h10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
