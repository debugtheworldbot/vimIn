import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, drawSelection, highlightActiveLine, lineNumbers } from "@codemirror/view";
import { EditorState, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { vim, Vim, getCM } from "@replit/codemirror-vim";
import type { CodeMirrorV } from "@replit/codemirror-vim";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";

interface VimEditorProps {
  onCopy: (text: string) => void;
  onModeChange: (mode: string) => void;
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
    padding: "12px 16px",
    minHeight: "200px",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#a78bfa",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(167, 139, 250, 0.3) !important",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "#52525b",
    border: "none",
    paddingLeft: "8px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "#a1a1aa",
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
    padding: "12px 16px",
    minHeight: "200px",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#2563eb",
    borderLeftWidth: "2px",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(37, 99, 235, 0.18) !important",
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

export default function VimEditor({ onCopy, onModeChange, theme }: VimEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

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

    // Mode change listener via update listener
    const modeChangeListener = EditorView.updateListener.of((update) => {
      if (update.transactions.length > 0) {
        const cm = getCM(update.view);
        if (cm) {
          const vimState = (cm as any).state?.vim;
          if (vimState) {
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
        markdown(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        themeCompartment.of(theme === "dark" ? darkTheme : lightTheme),
        modeChangeListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

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
        viewRef.current.focus();
      }
    };
    window.addEventListener("clear-editor", handleClear);
    return () => window.removeEventListener("clear-editor", handleClear);
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
