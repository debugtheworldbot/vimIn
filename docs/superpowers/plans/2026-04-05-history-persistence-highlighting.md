# History, Persistence & Syntax Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add history browsing, content persistence across restarts, and multi-language syntax highlighting to VimIn.

**Architecture:** Rust backend gets 4 new IPC commands for history and buffer file I/O. Frontend gets a new HistoryList overlay component, language detection in VimEditor via CodeMirror Compartment, and App.tsx orchestrates save/load on hide/mount events.

**Tech Stack:** Tauri 2 (Rust), React 19, CodeMirror 6, @codemirror/lang-{javascript,python,json}

---

### Task 1: Rust backend — buffer persistence IPC commands

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add `save_buffer` and `load_buffer` commands**

In `lib.rs`, add these two functions after the existing `update_visibility_settings` command (around line 351):

```rust
#[tauri::command]
fn save_buffer(app: AppHandle, content: String) {
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&dir).ok();
    fs::write(dir.join("buffer.txt"), content).ok();
}

#[tauri::command]
fn load_buffer(app: AppHandle) -> Option<String> {
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let path = dir.join("buffer.txt");
    if path.exists() {
        fs::read_to_string(path).ok()
    } else {
        None
    }
}
```

- [ ] **Step 2: Register the new commands in the invoke handler**

Change the `invoke_handler` call (line 478) from:

```rust
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_main_window,
            get_shortcut,
            update_shortcut,
            get_visibility_settings,
            update_visibility_settings
        ])
```

to:

```rust
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_main_window,
            get_shortcut,
            update_shortcut,
            get_visibility_settings,
            update_visibility_settings,
            save_buffer,
            load_buffer,
        ])
```

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/tian/Developer/vimIn && cargo check --manifest-path src-tauri/Cargo.toml`
Expected: compiles with no errors.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add save_buffer and load_buffer IPC commands"
```

---

### Task 2: Rust backend — history IPC commands

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add HistoryEntry struct**

Add this struct after the existing `VisibilitySettings` struct (around line 51):

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
struct HistoryEntry {
    content: String,
    timestamp: u64,
}
```

- [ ] **Step 2: Add `save_history_entry` and `get_history` commands**

Add after the `load_buffer` command:

```rust
#[tauri::command]
fn save_history_entry(app: AppHandle, content: String) {
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return;
    }

    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&dir).ok();
    let path = dir.join("history.json");

    let mut entries: Vec<HistoryEntry> = if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|data| serde_json::from_str(&data).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    };

    // Skip if duplicate of most recent entry
    if let Some(first) = entries.first() {
        if first.content == content {
            return;
        }
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    entries.insert(0, HistoryEntry { content, timestamp });

    // Keep max 50 entries
    entries.truncate(50);

    if let Ok(data) = serde_json::to_string_pretty(&entries) {
        fs::write(path, data).ok();
    }
}

#[tauri::command]
fn get_history(app: AppHandle) -> Vec<HistoryEntry> {
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    let path = dir.join("history.json");

    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|data| serde_json::from_str(&data).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    }
}
```

- [ ] **Step 3: Register the new commands in the invoke handler**

Update `invoke_handler` to include the two new commands:

```rust
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_main_window,
            get_shortcut,
            update_shortcut,
            get_visibility_settings,
            update_visibility_settings,
            save_buffer,
            load_buffer,
            save_history_entry,
            get_history,
        ])
```

- [ ] **Step 4: Verify it compiles**

Run: `cd /Users/tian/Developer/vimIn && cargo check --manifest-path src-tauri/Cargo.toml`
Expected: compiles with no errors.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add save_history_entry and get_history IPC commands"
```

---

### Task 3: Frontend — buffer persistence (save on hide, load on mount)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add buffer load on mount**

In the existing `useEffect` that loads shortcut/visibility settings (line 53-71), add `load_buffer` to the Promise.all and dispatch an event with the loaded content. Replace the entire useEffect:

```typescript
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
```

- [ ] **Step 2: Add save-on-hide helper function**

Add a new `saveOnHide` function before `handleClose`:

```typescript
  const saveOnHide = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const content = (document.querySelector(".cm-content") as HTMLElement)?.innerText || "";
      await Promise.all([
        invoke("save_buffer", { content }),
        invoke("save_history_entry", { content }),
      ]);
    } catch {
      // Not in Tauri environment
    }
  }, []);
```

- [ ] **Step 3: Call saveOnHide before window hide**

Update `handleClose` to call `saveOnHide` before hiding:

```typescript
  const handleClose = useCallback(async () => {
    await saveOnHide();
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
    } catch {
      // Not in Tauri environment
    }
  }, [saveOnHide]);
```

Also update `handleCopy` — save before hiding. Replace the auto-hide section (lines 115-122):

```typescript
    // Auto-hide window immediately after copy
    try {
      await saveOnHide();
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("hide_window");
      window.dispatchEvent(new Event("clear-editor"));
    } catch {
      // Not in Tauri environment
    }
```

- [ ] **Step 4: Listen for blur-triggered hide to save**

Add a new useEffect to listen for the Tauri blur event and save before the auto-hide fires:

```typescript
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
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /Users/tian/Developer/vimIn && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist buffer on hide and restore on launch"
```

---

### Task 4: Frontend — VimEditor handles load-buffer event and exposes content getter

**Files:**
- Modify: `src/components/VimEditor.tsx`

- [ ] **Step 1: Add load-buffer event listener**

Add a new useEffect after the existing "clear-editor" listener (after line 349):

```typescript
  // Listen for load-buffer event (restore persisted content on mount)
  useEffect(() => {
    const handleLoadBuffer = (e: Event) => {
      const content = (e as CustomEvent).detail as string;
      if (viewRef.current && content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        });
      }
    };
    window.addEventListener("load-buffer", handleLoadBuffer);
    return () => window.removeEventListener("load-buffer", handleLoadBuffer);
  }, []);
```

- [ ] **Step 2: Add get-content event listener for saveOnHide**

The `saveOnHide` in App.tsx currently reads content via DOM. A cleaner approach is to use a custom event. Add this useEffect:

```typescript
  // Listen for get-content event (used by save-on-hide)
  useEffect(() => {
    const handleGetContent = () => {
      if (viewRef.current) {
        const content = viewRef.current.state.doc.toString();
        window.dispatchEvent(new CustomEvent("editor-content", { detail: content }));
      }
    };
    window.addEventListener("get-content", handleGetContent);
    return () => window.removeEventListener("get-content", handleGetContent);
  }, []);
```

- [ ] **Step 3: Update saveOnHide in App.tsx to use event instead of DOM**

In `src/App.tsx`, replace the `saveOnHide` function:

```typescript
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
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /Users/tian/Developer/vimIn && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/VimEditor.tsx src/App.tsx
git commit -m "feat: wire up editor content events for buffer persistence"
```

---

### Task 5: Frontend — HistoryList overlay component

**Files:**
- Create: `src/components/HistoryList.tsx`

- [ ] **Step 1: Create the HistoryList component**

Create `src/components/HistoryList.tsx`:

```typescript
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
        selectedBorder: "1px solid rgba(167, 139, 250, 0.3)",
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
        selectedBorder: "1px solid rgba(99, 102, 241, 0.25)",
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
                onMouseEnter={(e) => {
                  setSelectedIndex(index);
                  if (index !== selectedIndex) {
                    e.currentTarget.style.backgroundColor = colors.hoverBg;
                  }
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd /Users/tian/Developer/vimIn && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/HistoryList.tsx
git commit -m "feat: add HistoryList overlay component"
```

---

### Task 6: Frontend — wire up :history command and HistoryList in App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/VimEditor.tsx`

- [ ] **Step 1: Add showHistory state and HistoryList to App.tsx**

In `src/App.tsx`, add the import at the top:

```typescript
import HistoryList from "./components/HistoryList";
```

Add state after the existing `showSettings` state (line 33):

```typescript
  const [showHistory, setShowHistory] = useState(false);
```

- [ ] **Step 2: Add history event listener in App.tsx**

Add a useEffect to listen for the "show-history" event:

```typescript
  // Listen for show-history event from Vim :history command
  useEffect(() => {
    const handleShowHistory = () => setShowHistory(true);
    window.addEventListener("show-history", handleShowHistory);
    return () => window.removeEventListener("show-history", handleShowHistory);
  }, []);
```

- [ ] **Step 3: Add history select handler in App.tsx**

Add a callback for when the user selects a history entry:

```typescript
  const handleHistorySelect = useCallback((content: string) => {
    window.dispatchEvent(new CustomEvent("load-buffer", { detail: content }));
    setShowHistory(false);
    window.dispatchEvent(new Event("focus-editor"));
  }, []);
```

- [ ] **Step 4: Render HistoryList in App.tsx JSX**

Add after the ShortcutRecorder block (after line 234), before the closing `</div>`:

```tsx
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
```

- [ ] **Step 5: Add :history Vim command in VimEditor.tsx**

In `src/components/VimEditor.tsx`, in the main useEffect where `:write`, `:quit`, and `:wq` are defined (around line 212-237), add after the `:wq` definition:

```typescript
    Vim.defineEx("history", "hist", function () {
      window.dispatchEvent(new Event("show-history"));
    });
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `cd /Users/tian/Developer/vimIn && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/VimEditor.tsx
git commit -m "feat: wire up :history command to open HistoryList overlay"
```

---

### Task 7: Frontend — multi-language syntax highlighting

**Files:**
- Modify: `package.json`
- Modify: `src/components/VimEditor.tsx`
- Modify: `src/components/StatusBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install language packages**

Run:

```bash
cd /Users/tian/Developer/vimIn && pnpm add @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-json
```

- [ ] **Step 2: Add language compartment and detection in VimEditor.tsx**

At the top of `src/components/VimEditor.tsx`, add imports:

```typescript
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";
```

Add a new Compartment after the existing `themeCompartment` (line 193):

```typescript
const languageCompartment = new Compartment();
```

Add the language type and detection function before the component:

```typescript
type Language = "markdown" | "javascript" | "python" | "json";

function detectLanguage(content: string): Language {
  const firstLine = content.split("\n").find((line) => line.trim() !== "") || "";
  const trimmed = firstLine.trim();

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (/\b(import |export |const |let |var |function )/.test(trimmed)) return "javascript";
  if (/\b(def |class \w+.*:)/.test(trimmed) || (trimmed.startsWith("import ") && !trimmed.includes("{"))) return "python";
  return "markdown";
}

function getLanguageExtension(lang: Language) {
  switch (lang) {
    case "javascript": return javascript({ typescript: true });
    case "python": return python();
    case "json": return json();
    case "markdown": return markdown();
  }
}
```

- [ ] **Step 3: Update VimEditor props and add language state**

Change the `VimEditorProps` interface:

```typescript
interface VimEditorProps {
  onCopy: (text: string) => void;
  onModeChange: (mode: string) => void;
  onLanguageChange: (lang: string) => void;
  theme: "dark" | "light";
}
```

Update the component signature:

```typescript
export default function VimEditor({ onCopy, onModeChange, onLanguageChange, theme }: VimEditorProps) {
```

Add a ref to track manual override:

```typescript
  const manualLangRef = useRef<Language | null>(null);
```

- [ ] **Step 4: Use languageCompartment in editor state**

In the `EditorState.create` call, replace the standalone `markdown()` (line 278) with:

```typescript
        languageCompartment.of(markdown()),
```

So the extensions array becomes:

```typescript
      extensions: [
        vim(),
        lineNumbers(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageCompartment.of(markdown()),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        themeCompartment.of(initialThemeRef.current === "dark" ? darkTheme : lightTheme),
        modeChangeListener,
        EditorView.lineWrapping,
      ],
```

After the editor is created (after `viewRef.current = view;`), notify parent of initial language:

```typescript
    onLanguageChange("markdown");
```

- [ ] **Step 5: Add `:set ft=` Vim command**

In the same useEffect where other Vim commands are defined, add:

```typescript
    Vim.defineEx("set", "set", function (_cm: unknown, params: { args?: string[] }) {
      const arg = params.args?.[0] || "";
      const match = arg.match(/^ft=(.+)$/);
      if (!match || !viewRef.current) return;

      const langMap: Record<string, Language> = {
        javascript: "javascript", js: "javascript", typescript: "javascript", ts: "javascript",
        python: "python", py: "python",
        json: "json",
        markdown: "markdown", md: "markdown",
      };

      const lang = langMap[match[1]];
      if (lang) {
        manualLangRef.current = lang;
        viewRef.current.dispatch({
          effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
        });
        onLanguageChange(lang);
      }
    });
```

- [ ] **Step 6: Add auto-detection on load-buffer and clear-editor events**

Update the existing `load-buffer` listener to detect language:

```typescript
  // Listen for load-buffer event (restore persisted content on mount)
  useEffect(() => {
    const handleLoadBuffer = (e: Event) => {
      const content = (e as CustomEvent).detail as string;
      if (viewRef.current && content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        });
        // Auto-detect language unless manually overridden
        if (!manualLangRef.current) {
          const lang = detectLanguage(content);
          viewRef.current.dispatch({
            effects: languageCompartment.reconfigure(getLanguageExtension(lang)),
          });
          onLanguageChange(lang);
        }
      }
    };
    window.addEventListener("load-buffer", handleLoadBuffer);
    return () => window.removeEventListener("load-buffer", handleLoadBuffer);
  }, [onLanguageChange]);
```

Update the existing `clear-editor` listener to reset language:

```typescript
  // Listen for clear-editor event
  useEffect(() => {
    const handleClear = () => {
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: "" },
        });
        // Reset to normal mode
        const cm = getCM(viewRef.current);
        if (hasVimState(cm)) {
          Vim.exitInsertMode(cm);
        }
        // Reset language override
        manualLangRef.current = null;
        viewRef.current.dispatch({
          effects: languageCompartment.reconfigure(markdown()),
        });
        onLanguageChange("markdown");
        viewRef.current.focus();
      }
    };
    window.addEventListener("clear-editor", handleClear);
    return () => window.removeEventListener("clear-editor", handleClear);
  }, [onLanguageChange]);
```

- [ ] **Step 7: Update App.tsx to pass onLanguageChange and language state**

In `src/App.tsx`, add language state:

```typescript
  const [language, setLanguage] = useState("markdown");
```

Update the `VimEditor` JSX:

```tsx
      <VimEditor onCopy={handleCopy} onModeChange={handleModeChange} onLanguageChange={setLanguage} theme={theme} />
```

Update the `StatusBar` JSX:

```tsx
      <StatusBar mode={mode} copied={copied} onCopyClick={handleCopyClick} theme={theme} language={language} />
```

- [ ] **Step 8: Update StatusBar to show language**

In `src/components/StatusBar.tsx`, update the props interface:

```typescript
interface StatusBarProps {
  mode: string;
  copied: boolean;
  onCopyClick: () => void;
  theme: "dark" | "light";
  language: string;
}
```

Update the component signature:

```typescript
export default function StatusBar({ mode, copied, onCopyClick, theme, language }: StatusBarProps) {
```

Replace the "VimInput" span (lines 85-94) with the language display:

```tsx
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
```

- [ ] **Step 9: Verify TypeScript compiles**

Run: `cd /Users/tian/Developer/vimIn && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/VimEditor.tsx src/components/StatusBar.tsx src/App.tsx
git commit -m "feat: add multi-language syntax highlighting with auto-detection"
```

---

### Task 8: Manual testing

- [ ] **Step 1: Run the app in dev mode**

Run: `cd /Users/tian/Developer/vimIn && pnpm run tauri dev`

- [ ] **Step 2: Test buffer persistence**

1. Type some text in the editor
2. Press `Cmd+W` to hide the window
3. Use the global shortcut (Alt+Space) to reopen
4. Verify the text is still there
5. Quit the app entirely (`Cmd+Q` from tray)
6. Reopen the app — verify text is restored

- [ ] **Step 3: Test history**

1. Type "first entry", press `Cmd+W` to hide
2. Reopen, clear with `Cmd+Shift+C`, type "second entry", hide again
3. Reopen, type `:history` and press Enter
4. Verify both entries appear with timestamps
5. Navigate with `j`/`k`, press Enter to restore
6. Verify editor content is replaced

- [ ] **Step 4: Test syntax highlighting**

1. Clear editor, type `{"key": "value"}` — verify JSON highlighting activates
2. Clear, type `const x = 1;` — verify JS highlighting
3. Clear, type `def foo():` — verify Python highlighting
4. Type `:set ft=json` — verify manual override works
5. Clear with `Cmd+Shift+C` — verify resets to Markdown

- [ ] **Step 5: Verify StatusBar shows language**

Check that the bottom-left of the status bar shows "markdown", "javascript", "python", or "json" as appropriate.
