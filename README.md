# VimIn

A global floating Vim editor for macOS. Press a hotkey, type with Vim keybindings, copy to clipboard, dismiss. Use it anywhere.

## Features

- **Global hotkey** (default `⌥ Space`) summons a floating editor overlay on top of any app
- **Full Vim mode** powered by CodeMirror 6 + @replit/codemirror-vim
- **`:w`** copies buffer to clipboard, **`:q`** clears and hides, **`:wq`** copies and hides
- **Syntax highlighting** for Markdown, JavaScript/TypeScript, Python, JSON with auto-detection
- **`:set ft=<lang>`** to manually switch language
- **Clipboard history** — browse and reuse past entries with **`:history`**
- **Dark / light theme** follows system preference, toggleable in the title bar
- **Configurable shortcut** — remap the global hotkey from settings
- **Always-on-top** transparent window, auto-hides on blur
- **System tray** for quick access

## Install

Download the latest `.dmg` from [Releases](https://github.com/debugtheworldbot/vimIn/releases).

## Build from source

Requires: Node.js, pnpm, Rust toolchain.

```bash
pnpm install
pnpm run tauri build
```

## Development

```bash
pnpm run tauri dev
```

## Tech Stack

Tauri 2 (Rust) + React 19 + TypeScript + CodeMirror 6

## License

MIT
