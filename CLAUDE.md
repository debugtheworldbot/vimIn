# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VimIn — a macOS desktop app providing a global floating Vim-mode text editor. Built with Tauri 2 (Rust backend) + React 19 + TypeScript + CodeMirror 6 with @replit/codemirror-vim.

## Commands

```bash
pnpm run tauri dev        # Run the full app in dev mode (frontend HMR + Rust rebuild)
pnpm dev                  # Frontend-only dev server (localhost:5173)
pnpm build                # TypeScript compile + Vite bundle (syncs versions first)
pnpm run tauri build      # Package as native macOS .app
pnpm lint                 # ESLint
```

Release: `./release.sh <version>` — bumps version across package.json/Cargo.toml/tauri.conf.json, tags, pushes. GitHub Actions builds and publishes the release.

## Architecture

**Frontend** (`src/`): React app with hooks-based state in `App.tsx`. Components:
- `VimEditor.tsx` — CodeMirror editor with Vim mode, the core of the app
- `StatusBar.tsx` — Vim mode indicator and controls
- `TitleBar.tsx` — Custom window title bar with menu
- `ShortcutRecorder.tsx` — UI for configuring the global hotkey

**Backend** (`src-tauri/src/lib.rs`): Single-file Rust backend handling:
- Window management (transparency, always-on-top, auto-hide on blur after 150ms)
- Global shortcut registration (default Alt+Space to toggle)
- System tray with Show/Quit
- Settings persistence as JSON in `~/.config/com.viminput.app/`
- IPC commands: `get_shortcut`, `update_shortcut`, `get_visibility_settings`, `update_visibility_settings`, `hide_window`, `show_main_window`

**IPC**: Frontend dynamically imports `@tauri-apps/api` to gracefully handle non-Tauri environments (browser dev).

## Design Docs

Feature specs and implementation plans are in `docs/superpowers/`. When modifying a feature that has a corresponding doc, read the doc first and treat it as the source of truth for requirements.

- `docs/superpowers/specs/` — feature design specs (what to build and why)
- `docs/superpowers/plans/` — implementation plans (how to build, step by step)

## Key Details

- macOS-only: uses `macOSPrivateApi: true` in Tauri config for advanced window behavior
- Version syncing: `scripts/sync-version.mjs` keeps package.json, Cargo.toml, and tauri.conf.json versions aligned — runs automatically before build/tauri commands
- Window: 620x420px, transparent, decorations disabled, always-on-top
- Theme: dark/light mode persisted in localStorage
- Ad-hoc code signing (not notarized)
