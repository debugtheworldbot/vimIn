import { useState, useCallback, useEffect } from "react";
import VimEditor from "./components/VimEditor";
import StatusBar from "./components/StatusBar";
import TitleBar from "./components/TitleBar";
import ShortcutRecorder from "./components/ShortcutRecorder";

const DEFAULT_SHORTCUT = "Alt+Space";
type ThemeMode = "dark" | "light";

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

function App() {
  const [mode, setMode] = useState("NORMAL");
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState(DEFAULT_SHORTCUT);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const themeStyles = theme === "dark"
    ? {
        appBackground: "rgba(19, 20, 23, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        shadow: "0 10px 24px rgba(0, 0, 0, 0.08), 0 28px 90px rgba(0, 0, 0, 0.24), 0 48px 140px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.16)",
      }
    : {
        appBackground: "rgba(255, 255, 255, 0.18)",
        border: "1px solid rgba(255, 255, 255, 0.22)",
        shadow: "0 8px 20px rgba(15, 23, 42, 0.06), 0 26px 80px rgba(15, 23, 42, 0.12), 0 42px 130px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.78)",
      };

  // Load saved shortcut on mount
  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const saved = await invoke<string>("get_shortcut");
        if (saved) {
          setCurrentShortcut(saved);
        }
      } catch {
        // Not in Tauri environment or command not available
      }
    })();
  }, []);

  const handleShortcutChange = useCallback(async (newShortcut: string) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("update_shortcut", { shortcut: newShortcut });
      setCurrentShortcut(newShortcut);
    } catch (e) {
      console.error("Failed to update shortcut:", e);
    }
    setShowSettings(false);
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
    } catch {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.error("Failed to copy:", e);
        return;
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Auto-hide window immediately after copy
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
      window.dispatchEvent(new Event("clear-editor"));
    } catch {
      // Not in Tauri environment
    }
  }, []);

  const handleCopyClick = useCallback(() => {
    window.dispatchEvent(new Event("copy-all"));
  }, []);

  const handleClose = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
    } catch {
      // Not in Tauri environment
    }
  }, []);

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + Enter: copy all content
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event("copy-all"));
        return;
      }
      // Cmd/Ctrl + W: close the current window
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w") {
        e.preventDefault();
        e.stopPropagation();
        void handleClose();
        return;
      }
      // Escape closes settings if open
      if (e.key === "Escape" && showSettings) {
        e.preventDefault();
        setShowSettings(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleClose, showSettings]);

  // Listen for window show event to focus editor
  useEffect(() => {
    const handleWindowFocus = () => {
      if (!showSettings) {
        window.dispatchEvent(new Event("focus-editor"));
      }
    };

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("tauri://focus", handleWindowFocus);
    }).catch(() => {
      // Not in Tauri environment
    });

    window.dispatchEvent(new Event("focus-editor"));
  }, [showSettings]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: themeStyles.appBackground,
        backdropFilter: "blur(26px) saturate(1.35)",
        WebkitBackdropFilter: "blur(26px) saturate(1.35)",
        borderRadius: "20px",
        overflow: "hidden",
        border: themeStyles.border,
        boxShadow: themeStyles.shadow,
      }}
    >
      <TitleBar
        onClose={handleClose}
        onSettingsClick={() => setShowSettings(true)}
        shortcutDisplay={formatShortcutDisplay(currentShortcut)}
        theme={theme}
        onThemeToggle={() => setTheme((current) => {
          const next = current === "dark" ? "light" : "dark";
          localStorage.setItem("theme", next);
          return next;
        })}
      />
      <VimEditor onCopy={handleCopy} onModeChange={handleModeChange} theme={theme} />
      <StatusBar mode={mode} copied={copied} onCopyClick={handleCopyClick} theme={theme} />

      {showSettings && (
        <ShortcutRecorder
          currentShortcut={currentShortcut}
          onShortcutChange={handleShortcutChange}
          onClose={() => setShowSettings(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

export default App;
