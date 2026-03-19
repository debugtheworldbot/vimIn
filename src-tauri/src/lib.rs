use std::{fs, thread, time::Duration};
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{
    AppHandle, Emitter, Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri_plugin_liquid_glass::{GlassMaterialVariant, LiquidGlassConfig, LiquidGlassExt};

// ── Settings persistence ──────────────────────────────────────────────

const DEFAULT_SHORTCUT: &str = "Alt+Space";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AppSettings {
    shortcut: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            shortcut: DEFAULT_SHORTCUT.to_string(),
        }
    }
}

fn settings_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

fn load_settings(app: &AppHandle) -> AppSettings {
    let path = settings_path(app);
    if path.exists() {
        if let Ok(data) = fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str::<AppSettings>(&data) {
                return settings;
            }
        }
    }
    AppSettings::default()
}

fn save_settings(app: &AppHandle, settings: &AppSettings) {
    let path = settings_path(app);
    if let Ok(data) = serde_json::to_string_pretty(settings) {
        fs::write(path, data).ok();
    }
}

// ── Shortcut parsing ──────────────────────────────────────────────────

fn parse_modifiers(s: &str) -> Modifiers {
    let mut mods = Modifiers::empty();
    for part in s.split('+') {
        match part.trim() {
            "Alt" => mods |= Modifiers::ALT,
            "Shift" => mods |= Modifiers::SHIFT,
            "Control" => mods |= Modifiers::CONTROL,
            "Meta" | "Cmd" | "Super" => mods |= Modifiers::META,
            _ => {}
        }
    }
    mods
}

fn parse_code(s: &str) -> Option<Code> {
    let key_part = s.split('+').last()?.trim();
    let code = match key_part {
        "Space" => Code::Space,
        "Enter" => Code::Enter,
        "Tab" => Code::Tab,
        "Escape" => Code::Escape,
        "Backspace" => Code::Backspace,
        "Delete" => Code::Delete,
        "Up" => Code::ArrowUp,
        "Down" => Code::ArrowDown,
        "Left" => Code::ArrowLeft,
        "Right" => Code::ArrowRight,
        "Home" => Code::Home,
        "End" => Code::End,
        "PageUp" => Code::PageUp,
        "PageDown" => Code::PageDown,
        "Insert" => Code::Insert,
        "F1" => Code::F1,
        "F2" => Code::F2,
        "F3" => Code::F3,
        "F4" => Code::F4,
        "F5" => Code::F5,
        "F6" => Code::F6,
        "F7" => Code::F7,
        "F8" => Code::F8,
        "F9" => Code::F9,
        "F10" => Code::F10,
        "F11" => Code::F11,
        "F12" => Code::F12,
        "A" => Code::KeyA,
        "B" => Code::KeyB,
        "C" => Code::KeyC,
        "D" => Code::KeyD,
        "E" => Code::KeyE,
        "F" => Code::KeyF,
        "G" => Code::KeyG,
        "H" => Code::KeyH,
        "I" => Code::KeyI,
        "J" => Code::KeyJ,
        "K" => Code::KeyK,
        "L" => Code::KeyL,
        "M" => Code::KeyM,
        "N" => Code::KeyN,
        "O" => Code::KeyO,
        "P" => Code::KeyP,
        "Q" => Code::KeyQ,
        "R" => Code::KeyR,
        "S" => Code::KeyS,
        "T" => Code::KeyT,
        "U" => Code::KeyU,
        "V" => Code::KeyV,
        "W" => Code::KeyW,
        "X" => Code::KeyX,
        "Y" => Code::KeyY,
        "Z" => Code::KeyZ,
        "0" => Code::Digit0,
        "1" => Code::Digit1,
        "2" => Code::Digit2,
        "3" => Code::Digit3,
        "4" => Code::Digit4,
        "5" => Code::Digit5,
        "6" => Code::Digit6,
        "7" => Code::Digit7,
        "8" => Code::Digit8,
        "9" => Code::Digit9,
        "-" => Code::Minus,
        "=" => Code::Equal,
        "[" => Code::BracketLeft,
        "]" => Code::BracketRight,
        "\\" => Code::Backslash,
        ";" => Code::Semicolon,
        "'" => Code::Quote,
        "," => Code::Comma,
        "." => Code::Period,
        "/" => Code::Slash,
        "`" => Code::Backquote,
        _ => return None,
    };
    Some(code)
}

fn parse_shortcut(s: &str) -> Option<Shortcut> {
    let mods = parse_modifiers(s);
    let code = parse_code(s)?;
    let mods_opt = if mods.is_empty() { None } else { Some(mods) };
    Some(Shortcut::new(mods_opt, code))
}

// ── Window helpers ────────────────────────────────────────────────────

fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.center();
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("window-shown", ());
        }
    }
}

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.center();
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("window-shown", ());
    }
}

fn hide_window_inner(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

// ── Tauri commands ────────────────────────────────────────────────────

#[tauri::command]
fn hide_window(app: AppHandle) {
    hide_window_inner(&app);
}

#[tauri::command]
fn show_main_window(app: AppHandle) {
    show_window(&app);
}

#[tauri::command]
fn get_shortcut(app: AppHandle) -> String {
    let settings = load_settings(&app);
    settings.shortcut
}

#[tauri::command]
fn update_shortcut(app: AppHandle, shortcut: String, state: tauri::State<'_, ShortcutState_>) -> Result<(), String> {
    // Parse the new shortcut
    let new_sc = parse_shortcut(&shortcut).ok_or("Invalid shortcut format")?;

    // Unregister old shortcut
    let old_shortcut_str = {
        let guard = state.current.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };
    if let Some(old_sc) = parse_shortcut(&old_shortcut_str) {
        app.global_shortcut().unregister(old_sc).ok();
    }

    // Register new shortcut
    app.global_shortcut()
        .on_shortcut(new_sc, |app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                toggle_window(app);
            }
        })
        .map_err(|e| format!("Failed to register shortcut: {}", e))?;

    // Save to settings
    let settings = AppSettings {
        shortcut: shortcut.clone(),
    };
    save_settings(&app, &settings);

    // Update state
    {
        let mut guard = state.current.lock().map_err(|e| e.to_string())?;
        *guard = shortcut;
    }

    Ok(())
}

// ── App state ─────────────────────────────────────────────────────────

struct ShortcutState_ {
    current: Mutex<String>,
}

// ── Main ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_liquid_glass::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|_app, _shortcut, _event| {
                    // Handler is set per-shortcut via on_shortcut, this is a no-op fallback
                })
                .build(),
        )
        .manage(ShortcutState_ {
            current: Mutex::new(DEFAULT_SHORTCUT.to_string()),
        })
        .setup(|app| {
            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Load saved settings
            let settings = load_settings(app.handle());
            let shortcut_str = settings.shortcut.clone();

            // Update managed state
            {
                let state = app.state::<ShortcutState_>();
                let mut guard = state.current.lock().unwrap();
                *guard = shortcut_str.clone();
            }

            // Register the saved (or default) shortcut
            if let Some(sc) = parse_shortcut(&shortcut_str) {
                app.global_shortcut()
                    .on_shortcut(sc, |app, _shortcut, event| {
                        if event.state == ShortcutState::Pressed {
                            toggle_window(app);
                        }
                    })?;
            }

            // Build system tray
            let quit_item = MenuItem::with_id(app, "quit", "Quit VimInput", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show VimInput", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        show_window(app);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray: &tauri::tray::TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_window(app);
                    }
                })
                .build(app)?;

            // Handle window blur -> auto hide
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_shadow(true);
                let _ = app.handle().liquid_glass().set_effect(
                    &window,
                    LiquidGlassConfig {
                        enabled: true,
                        corner_radius: 18.0,
                        tint_color: Some("#FFFFFF08".into()),
                        variant: GlassMaterialVariant::Clear,
                    },
                );

                let event_window = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(false) = event {
                        let window = event_window.clone();
                        thread::spawn(move || {
                            thread::sleep(Duration::from_millis(150));

                            if window.is_focused().unwrap_or(false) {
                                return;
                            }

                            let _ = window.hide();
                        });
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_main_window,
            get_shortcut,
            update_shortcut
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
