# Help Modal (? Button) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "?" help button in TitleBar and a keyboard shortcut modal showing all app & Vim shortcuts.

**Architecture:** New `HelpModal.tsx` component renders a themed overlay with two-column shortcut reference. Triggered via TitleBar button click, Normal-mode `?` keypress (Vim map), or `showHelp` state toggle in `App.tsx`. Closes on Escape, overlay click, or repeat `?`.

**Tech Stack:** React, inline styles (matching existing pattern), @replit/codemirror-vim `Vim.map`

---

### Task 1: Create HelpModal component

**Files:**
- Create: `src/components/HelpModal.tsx`

- [ ] **Step 1: Create HelpModal.tsx**

```tsx
import { useEffect } from "react";

interface HelpModalProps {
  theme: "dark" | "light";
  onClose: () => void;
}

const APP_SHORTCUTS = [
  { keys: "⌥ Space", desc: "Toggle window" },
  { keys: "⌘ Enter", desc: "Copy all" },
  { keys: "⌘ ⇧ C", desc: "Clear editor" },
  { keys: "⌘ W", desc: "Hide window" },
];

const VIM_COMMANDS = [
  { keys: ":w", desc: "Copy content" },
  { keys: ":q", desc: "Hide window" },
  { keys: ":wq", desc: "Copy & hide" },
  { keys: ":h", desc: "History" },
  { keys: ":set ft=X", desc: "Set language" },
];

export default function HelpModal({ theme, onClose }: HelpModalProps) {
  const isDark = theme === "dark";
  const colors = isDark
    ? {
        overlay: "rgba(0, 0, 0, 0.6)",
        bg: "rgba(39, 39, 42, 0.98)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        title: "#e4e4e7",
        text: "rgba(255, 255, 255, 0.72)",
        muted: "rgba(255, 255, 255, 0.32)",
        kbdBg: "rgba(255, 255, 255, 0.08)",
        kbdBorder: "1px solid rgba(255, 255, 255, 0.12)",
        kbdText: "rgba(255, 255, 255, 0.8)",
        sectionTitle: "rgba(255, 255, 255, 0.46)",
      }
    : {
        overlay: "rgba(24, 24, 27, 0.2)",
        bg: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(24, 24, 27, 0.08)",
        title: "#1c1917",
        text: "rgba(17, 24, 39, 0.72)",
        muted: "rgba(17, 24, 39, 0.34)",
        kbdBg: "rgba(24, 24, 27, 0.06)",
        kbdBorder: "1px solid rgba(24, 24, 27, 0.1)",
        kbdText: "rgba(17, 24, 39, 0.8)",
        sectionTitle: "rgba(17, 24, 39, 0.44)",
      };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  const kbdStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: "4px",
    backgroundColor: colors.kbdBg,
    border: colors.kbdBorder,
    color: colors.kbdText,
    fontSize: "11px",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontWeight: 500,
    lineHeight: "18px",
  };

  const renderSection = (title: string, items: { keys: string; desc: string }[]) => (
    <div style={{ flex: 1 }}>
      <div style={{
        fontSize: "10px",
        fontWeight: 600,
        color: colors.sectionTitle,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item) => (
          <div key={item.keys} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}>
            <span style={kbdStyle}>{item.keys}</span>
            <span style={{
              fontSize: "11px",
              color: colors.text,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            }}>
              {item.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

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
          width: "360px",
          backgroundColor: colors.bg,
          borderRadius: "12px",
          border: colors.border,
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          animation: "modal-in 0.2s ease",
        }}
      >
        <div style={{
          padding: "12px 16px 10px",
          fontSize: "12px",
          fontWeight: 600,
          color: colors.title,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
          borderBottom: colors.border,
        }}>
          Keyboard Shortcuts
        </div>
        <div style={{
          padding: "14px 16px",
          display: "flex",
          gap: "20px",
        }}>
          {renderSection("App", APP_SHORTCUTS)}
          {renderSection("Vim", VIM_COMMANDS)}
        </div>
        <div style={{
          padding: "6px 16px 8px",
          fontSize: "10px",
          color: colors.muted,
          fontFamily: "'SF Mono', Menlo, Monaco, monospace",
          borderTop: colors.border,
          textAlign: "center",
        }}>
          Press ? or Esc to close
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HelpModal.tsx
git commit -m "feat: add HelpModal component"
```

---

### Task 2: Add ? button to TitleBar

**Files:**
- Modify: `src/components/TitleBar.tsx`

- [ ] **Step 1: Add `onHelpClick` prop to TitleBar**

Add `onHelpClick: () => void;` to the `TitleBarProps` interface and destructure it.

- [ ] **Step 2: Add ? button before the theme toggle button**

Insert a new button with `?` SVG icon (circle with question mark) using the same 22x22 icon button pattern as theme/settings buttons. Place it before the theme toggle:

```tsx
<button
  data-tauri-no-drag
  onMouseDown={(e) => { e.stopPropagation(); }}
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TitleBar.tsx
git commit -m "feat: add help button to TitleBar"
```

---

### Task 3: Wire up state and Vim keybinding in App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/VimEditor.tsx`

- [ ] **Step 1: Add showHelp state and toggle in App.tsx**

Add state: `const [showHelp, setShowHelp] = useState(false);`

Add toggle callback: `const toggleHelp = useCallback(() => setShowHelp(prev => !prev), []);`

Import HelpModal: `import HelpModal from "./components/HelpModal";`

- [ ] **Step 2: Pass onHelpClick to TitleBar**

Add `onHelpClick={toggleHelp}` to the `<TitleBar>` JSX.

- [ ] **Step 3: Render HelpModal conditionally**

Add after the HistoryList block:

```tsx
{showHelp && (
  <HelpModal
    theme={theme}
    onClose={() => {
      setShowHelp(false);
      window.dispatchEvent(new Event("focus-editor"));
    }}
  />
)}
```

- [ ] **Step 4: Add `?` keyboard listener for toggling help**

In the global `handleKeyDown` in App.tsx, add a case before the existing handlers. Check: if `?` is pressed (Shift+/ produces `?`), not in INSERT mode, and no other modal is open, toggle help:

```tsx
// ? key: toggle help (only in Normal mode, no other modal open)
if (e.key === "?" && !showSettings && !showHistory) {
  e.preventDefault();
  e.stopPropagation();
  setShowHelp(prev => !prev);
  return;
}
```

Also update the Escape handler to close help:

```tsx
if (e.key === "Escape" && showHelp) {
  e.preventDefault();
  setShowHelp(false);
  return;
}
```

Add `showHelp` to the `useEffect` dependency array.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/VimEditor.tsx
git commit -m "feat: wire up help modal toggle via button and ? key"
```

---

### Task 4: Manual testing

- [ ] **Step 1: Run dev server**

```bash
pnpm run tauri dev
```

- [ ] **Step 2: Verify all trigger/close paths**

1. Click `?` button in TitleBar → modal opens
2. Press Escape → modal closes
3. Press `?` in Normal mode → modal opens
4. Press `?` again → modal closes
5. Click outside modal → modal closes
6. Open modal → verify two-column layout with correct shortcuts
7. Dark/light theme toggle → verify modal follows theme

- [ ] **Step 3: Verify no regressions**

1. Type `?` in Insert mode → should type `?` normally, not open modal
2. Settings modal still works
3. History modal still works
4. `:w`, `:q` commands still work

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: help modal polish"
```
