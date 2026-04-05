import { useState, useCallback, useEffect } from "react";
import VimEditor from "./components/VimEditor";
import StatusBar from "./components/StatusBar";
import TitleBar from "./components/TitleBar";
import ShortcutRecorder from "./components/ShortcutRecorder";
import HistoryList from "./components/HistoryList";

const DEFAULT_SHORTCUT = "Alt+Space";
type ThemeMode = "dark" | "light";

type VisibilitySettings = {
  hide_menu_bar_icon: boolean;
};

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
  const [showHistory, setShowHistory] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState(DEFAULT_SHORTCUT);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>({
    hide_menu_bar_icon: false,
  });

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

  // Load saved settings and buffer on mount
  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const [savedShortcut, savedVisibilitySettings, savedBuffer] = await Promise.all([
          invoke<string>("get_shortcut"),
          invoke<VisibilitySettings>("get_visibility_settings"),
          invoke<string | null>("load_buffer"),
        ]);

        if (savedShortcut) {
          setCurrentShortcut(savedShortcut);
        }

        setVisibilitySettings(savedVisibilitySettings);

        if (savedBuffer) {
          window.dispatchEvent(new CustomEvent("load-buffer", { detail: savedBuffer }));
        }
      } catch {
        // Not in Tauri environment or command not available
      }
    })();
  }, []);

  useEffect(() => {
    const handleShowHistory = () => setShowHistory(true);
    window.addEventListener("show-history", handleShowHistory);
    return () => window.removeEventListener("show-history", handleShowHistory);
  }, []);

  const handleHistorySelect = useCallback((content: string) => {
    window.dispatchEvent(new CustomEvent("load-buffer", { detail: content }));
    setShowHistory(false);
    window.dispatchEvent(new Event("focus-editor"));
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

  const handleVisibilitySettingsChange = useCallback(async (nextSettings: VisibilitySettings) => {
    setVisibilitySettings(nextSettings);

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("update_visibility_settings", {
        hideMenuBarIcon: nextSettings.hide_menu_bar_icon,
      });
    } catch (e) {
      console.error("Failed to update visibility settings:", e);
    }
  }, []);

  const saveOnHide = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      // Get content from editor via synchronous event
      let content = "";
      const handler = (e: Event) => {
        content = (e as CustomEvent).detail as string;
      };
      window.addEventListener("editor-content", handler, { once: true });
      window.dispatchEvent(new Event("get-content"));
      window.removeEventListener("editor-content", handler);

      await Promise.all([
        invoke("save_buffer", { content }),
        invoke("save_history_entry", { content }),
      ]);
    } catch {
      // Not in Tauri environment
    }
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
      await saveOnHide();
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
      window.dispatchEvent(new Event("clear-editor"));
    } catch {
      // Not in Tauri environment
    }
  }, [saveOnHide]);

  const handleCopyClick = useCallback(() => {
    window.dispatchEvent(new Event("copy-all"));
  }, []);

  const handleClose = useCallback(async () => {
    await saveOnHide();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
    } catch {
      // Not in Tauri environment
    }
  }, [saveOnHide]);

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
      // Cmd/Ctrl + Shift + C: clear editor
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        window.dispatchEvent(new Event("clear-editor"));
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

  // Save buffer and history when window loses focus (before auto-hide)
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("tauri://blur", () => {
        void saveOnHide();
      }).then((unlisten) => {
        cleanup = unlisten;
      });
    }).catch(() => {});

    return () => cleanup?.();
  }, [saveOnHide]);

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
        transition: "background-color 0.35s ease, border 0.35s ease, box-shadow 0.35s ease",
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
          visibilitySettings={visibilitySettings}
          onVisibilitySettingsChange={handleVisibilitySettingsChange}
          onClose={() => setShowSettings(false)}
          theme={theme}
        />
      )}
      {showHistory && (
        <HistoryList
          theme={theme}
          onSelect={handleHistorySelect}
          onClose={() => {
            setShowHistory(false);
            window.dispatchEvent(new Event("focus-editor"));
          }}
        />
      )}
    </div>
  );
}

export default App;
