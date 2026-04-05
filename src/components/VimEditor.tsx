import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, drawSelection, highlightActiveLine, lineNumbers } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { vim, Vim, getCM } from "@replit/codemirror-vim";
import type { CodeMirrorV } from "@replit/codemirror-vim";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { json } from "@codemirror/lang-json";

interface VimEditorProps {
  onCopy: (text: string) => void;
  onModeChange: (mode: string) => void;
  onLanguageChange: (lang: string) => void;
  theme: "dark" | "light";
}

// Dark theme for the editor
const darkTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "#e4e4e7",
    fontSize: "14px",
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#a78bfa",
    padding: "12px 0",
    minHeight: "200px",
  },
  ".cm-line": {
    padding: "0 16px 0 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#a78bfa",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(167, 139, 250, 0.3) !important",
  },
  "& ::selection": {
    backgroundColor: "transparent !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "#a1a1aa",
    border: "none",
    paddingLeft: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#e4e4e7",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "2em",
    padding: "0 8px 0 0",
  },
  // Vim cursor styles
  ".cm-fat-cursor": {
    background: "rgba(167, 139, 250, 0.7) !important",
    color: "#1c1c1e !important",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    background: "none !important",
    outline: "solid 1px rgba(167, 139, 250, 0.5) !important",
    color: "transparent !important",
  },
  ".cm-vim-panel": {
    backgroundColor: "rgba(39, 39, 42, 0.95)",
    color: "#e4e4e7",
    padding: "4px 12px",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontSize: "13px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  },
  ".cm-vim-panel input": {
    backgroundColor: "transparent",
    color: "#e4e4e7",
    border: "none",
    outline: "none",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontSize: "13px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  // Scrollbar styling
  ".cm-scroller::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.15)",
    borderRadius: "3px",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "rgba(255, 255, 255, 0.25)",
  },
}, { dark: true });

const lightTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "#292524",
    fontSize: "14px",
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Menlo, Monaco, 'Courier New', monospace",
    height: "100%",
  },
  ".cm-content": {
    caretColor: "#2563eb",
    padding: "12px 0",
    minHeight: "200px",
  },
  ".cm-line": {
    padding: "0 16px 0 0",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#2563eb",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground": {
    backgroundColor: "rgba(37, 99, 235, 0.18) !important",
  },
  "& ::selection": {
    backgroundColor: "transparent !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(24, 24, 27, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "#a8a29e",
    border: "none",
    paddingLeft: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#57534e",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "2em",
    padding: "0 8px 0 0",
  },
  ".cm-fat-cursor": {
    background: "rgba(59, 130, 246, 0.28) !important",
    color: "#1c1917 !important",
  },
  "&:not(.cm-focused) .cm-fat-cursor": {
    background: "none !important",
    outline: "solid 1px rgba(37, 99, 235, 0.45) !important",
    color: "transparent !important",
  },
  ".cm-vim-panel": {
    backgroundColor: "rgba(245, 245, 244, 0.98)",
    color: "#292524",
    padding: "4px 12px",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontSize: "13px",
    borderTop: "1px solid rgba(24, 24, 27, 0.08)",
  },
  ".cm-vim-panel input": {
    backgroundColor: "transparent",
    color: "#292524",
    border: "none",
    outline: "none",
    fontFamily: "'SF Mono', Menlo, Monaco, monospace",
    fontSize: "13px",
  },
  ".cm-scroller": {
    overflow: "auto",
  },
  ".cm-scroller::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  ".cm-scroller::-webkit-scrollbar-track": {
    background: "transparent",
  },
  ".cm-scroller::-webkit-scrollbar-thumb": {
    background: "rgba(24, 24, 27, 0.12)",
    borderRadius: "3px",
  },
  ".cm-scroller::-webkit-scrollbar-thumb:hover": {
    background: "rgba(24, 24, 27, 0.2)",
  },
}, { dark: false });

const themeCompartment = new Compartment();
const languageCompartment = new Compartment();

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

export default function VimEditor({ onCopy, onModeChange, onLanguageChange, theme }: VimEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialThemeRef = useRef(theme);
  const manualLangRef = useRef<Language | null>(null);

  const handleCopy = useCallback((text: string) => {
    onCopy(text);
  }, [onCopy]);

  const hasVimState = (cm: ReturnType<typeof getCM>): cm is CodeMirrorV => {
    return Boolean(cm?.state?.vim);
  };

  useEffect(() => {
    if (!editorRef.current) return;

    // Define :w and :wq commands for copy
    Vim.defineEx("write", "w", function () {
      if (viewRef.current) {
        const text = viewRef.current.state.doc.toString();
        handleCopy(text);
      }
    });

    Vim.defineEx("quit", "q", function () {
      if (viewRef.current) {
        // Clear and hide
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: "" },
        });
        // Invoke Tauri hide
        import("@tauri-apps/api/core").then(({ invoke }) => {
          invoke("hide_window");
        });
      }
    });

    Vim.defineEx("wq", "wq", function () {
      if (viewRef.current) {
        const text = viewRef.current.state.doc.toString();
        handleCopy(text);
      }
    });

    Vim.defineEx("history", "hist", function () {
      window.dispatchEvent(new Event("show-history"));
    });

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

    // Mode change listener via update listener
    const modeChangeListener = EditorView.updateListener.of((update) => {
      if (update.transactions.length > 0) {
        const cm = getCM(update.view);
        if (hasVimState(cm)) {
          const { vim: vimState } = cm.state;
          let mode = "NORMAL";
          if (vimState.insertMode) {
            mode = "INSERT";
          } else if (vimState.visualMode) {
            if (vimState.visualLine) {
              mode = "V-LINE";
            } else if (vimState.visualBlock) {
              mode = "V-BLOCK";
            } else {
              mode = "VISUAL";
            }
          }
          onModeChange(mode);
        }
      }
    });

    const state = EditorState.create({
      doc: "",
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
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    onLanguageChange("markdown");

    // Focus editor on mount
    setTimeout(() => {
      view.focus();
    }, 50);

    return () => {
      view.destroy();
    };
  }, [handleCopy, onModeChange]);

  // Dynamically switch theme without recreating editor
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.reconfigure(theme === "dark" ? darkTheme : lightTheme),
      });
    }
  }, [theme]);

  // Expose focus method and getText
  useEffect(() => {
    const handleFocusEditor = () => {
      if (viewRef.current) {
        viewRef.current.focus();
      }
    };
    window.addEventListener("focus-editor", handleFocusEditor);
    return () => window.removeEventListener("focus-editor", handleFocusEditor);
  }, []);

  // Listen for get-text event
  useEffect(() => {
    const handleGetText = () => {
      if (viewRef.current) {
        const text = viewRef.current.state.doc.toString();
        handleCopy(text);
      }
    };
    window.addEventListener("copy-all", handleGetText);
    return () => window.removeEventListener("copy-all", handleGetText);
  }, [handleCopy]);

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

  // Listen for load-buffer event (restore persisted content on mount)
  useEffect(() => {
    const handleLoadBuffer = (e: Event) => {
      const content = (e as CustomEvent).detail as string;
      if (viewRef.current && content) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: content },
        });
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

  return (
    <div
      ref={editorRef}
      className="editor-container"
      style={{
        flex: 1,
        overflow: "hidden",
        borderRadius: "0",
      }}
    />
  );
}
