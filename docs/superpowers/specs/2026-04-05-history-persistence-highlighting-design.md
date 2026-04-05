# VimIn: History, Persistence & Syntax Highlighting

## Summary

Add three features to VimIn to evolve it from a quick-input tool into a lightweight scratchpad:

1. **History** — auto-save editor content when window hides, browse/restore via `:history`
2. **Content persistence** — survive app restarts
3. **Multi-language syntax highlighting** — auto-detect or manually set language

## 1. History

### Storage

- File: `~/.config/com.viminput.app/history.json`
- Format: JSON array of `{ content: string, timestamp: number }` (newest first)
- Max 50 entries; oldest dropped on overflow
- Empty/whitespace-only content is not saved
- Duplicate consecutive entries (same content as most recent) are not saved

### When to save

- On window hide (blur auto-hide or `:q` or `Cmd+W`)
- NOT on `:w` (that's copy, not history)

### Rust backend

- New IPC commands: `save_history_entry(content)`, `get_history() -> Vec<HistoryEntry>`
- History file read/write handled in `lib.rs` alongside existing settings persistence

### Frontend: `:history` command

- `Vim.defineEx("history", "hist", ...)` opens a fullscreen overlay list
- Each entry shows: truncated first line (max 60 chars) + relative timestamp ("2m ago", "1h ago")
- Navigation: `j`/`k` or arrow keys to move, `Enter` to restore selected entry, `Esc`/`:q` to close
- Restoring replaces current editor content entirely

## 2. Content Persistence

### Storage

- File: `~/.config/com.viminput.app/buffer.txt`
- Plain text, written on every window hide (same trigger as history save)

### Rust backend

- New IPC commands: `save_buffer(content)`, `load_buffer() -> Option<String>`

### Frontend

- On app mount, call `load_buffer()` and set as initial editor content
- On window hide, call `save_buffer(content)` before hiding

## 3. Multi-language Syntax Highlighting

### Supported languages

- Markdown (existing, default)
- JavaScript/TypeScript
- Python
- JSON

### Language detection

Auto-detect from first non-empty line:
- Starts with `{` or `[` → JSON
- Contains `import `, `export `, `const `, `let `, `var `, `function ` → JS/TS
- Contains `def `, `class ` (with Python-style colon), `import ` (no `from` with braces) → Python
- Fallback → Markdown

### Manual override

- `:set ft=<lang>` command (e.g., `:set ft=json`, `:set ft=python`, `:set ft=js`, `:set ft=markdown`)
- Manual override sticks until content is cleared or app restarts

### Implementation

- Use CodeMirror `Compartment` for language (same pattern as existing theme compartment)
- Language packages: `@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/lang-json`
- Auto-detection runs on first content change after clear/restore, not on every keystroke
- StatusBar shows current language name next to mode indicator

## Data flow

```
Window hide event
  ├── Frontend: get editor content
  ├── IPC: save_buffer(content)        → writes buffer.txt
  └── IPC: save_history_entry(content) → appends to history.json (if non-empty, non-duplicate)

App launch
  └── IPC: load_buffer()               → reads buffer.txt → set as editor content

:history command
  └── IPC: get_history()               → reads history.json → show overlay list
      └── User selects entry           → replace editor content
```

## Files to modify

| File | Changes |
|------|---------|
| `src-tauri/src/lib.rs` | Add history + buffer IPC commands, file I/O |
| `src-tauri/Cargo.toml` | No new deps needed (serde/serde_json already present) |
| `src/components/VimEditor.tsx` | `:history` and `:set ft=` commands, language compartment, auto-detect |
| `src/components/HistoryList.tsx` | New component: overlay list for history browsing |
| `src/components/StatusBar.tsx` | Show current language |
| `src/App.tsx` | Load buffer on mount, save buffer+history on hide |
| `src-tauri/capabilities/default.json` | No changes needed (uses existing IPC) |
| `package.json` | Add `@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/lang-json` |
