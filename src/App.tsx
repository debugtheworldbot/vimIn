import { useState, useCallback, useEffect } from "react";
import VimEditor from "./components/VimEditor";
import StatusBar from "./components/StatusBar";
import TitleBar from "./components/TitleBar";
import ShortcutRecorder from "./components/ShortcutRecorder";

const DEFAULT_SHORTCUT = "Alt+Space";
type ThemeMode = "dark" | "light";

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
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const themeStyles = theme === "dark"
    ? {
        appBackground: "rgba(24, 24, 27, 0.97)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      }
    : {
        appBackground: "rgba(250, 250, 249, 0.98)",
        border: "1px solid rgba(24, 24, 27, 0.08)",
        shadow: "0 20px 45px -18px rgba(24, 24, 27, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.6)",
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
        borderRadius: "12px",
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
        onThemeToggle={() => setTheme((current) => current === "dark" ? "light" : "dark")}
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
