use std::convert::TryInto;
use std::sync::Mutex;
use tauri::{App, AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutEvent, ShortcutState};

pub struct HotkeyState {
    pub overlay_hotkey: Mutex<String>,
    pub voice_hotkey: Mutex<String>,
}

fn shortcut_id(s: &str) -> Option<u32> {
    let sc: Result<Shortcut, _> = s.try_into();
    sc.ok().map(|sc| sc.id())
}

pub fn register_shortcuts(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let overlay_hotkey = get_setting_from_app(app, "overlay_hotkey")
        .unwrap_or_else(|| "Ctrl+Shift+B".to_string());
    let voice_hotkey = get_setting_from_app(app, "voice_hotkey")
        .unwrap_or_else(|| "Ctrl+Shift+V".to_string());

    app.manage(HotkeyState {
        overlay_hotkey: Mutex::new(overlay_hotkey.clone()),
        voice_hotkey: Mutex::new(voice_hotkey.clone()),
    });

    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(
                |app: &AppHandle, pressed: &Shortcut, event: ShortcutEvent| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let state = app.state::<HotkeyState>();
                    let overlay_str = state.overlay_hotkey.lock().unwrap().clone();
                    let voice_str = state.voice_hotkey.lock().unwrap().clone();
                    let pressed_id = pressed.id();

                    let is_overlay = shortcut_id(&overlay_str)
                        .map(|id| id == pressed_id)
                        .unwrap_or(false);
                    let is_voice = shortcut_id(&voice_str)
                        .map(|id| id == pressed_id)
                        .unwrap_or(false);

                    if is_overlay {
                        toggle_overlay_window_internal(app);
                    } else if is_voice {
                        if let Some(win) = app.get_webview_window("voice-indicator") {
                            let _ = win.emit("stop-recording", ());
                        } else {
                            create_voice_indicator_window(app);
                        }
                    }
                },
            )
            .build(),
    )?;

    if let Err(e) = app.global_shortcut().register(overlay_hotkey.as_str()) {
        eprintln!("Failed to register overlay hotkey '{}': {}", overlay_hotkey, e);
    }
    if let Err(e) = app.global_shortcut().register(voice_hotkey.as_str()) {
        eprintln!("Failed to register voice hotkey '{}': {}", voice_hotkey, e);
    }

    Ok(())
}

fn get_setting_from_app(app: &App, key: &str) -> Option<String> {
    use crate::db::DbState;
    let state = app.state::<DbState>();
    let conn = state.0.lock().ok()?;
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get::<_, String>(0),
    )
    .ok()
}

fn toggle_overlay_window_internal(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("overlay") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    } else {
        let position = get_overlay_position(app);
        create_overlay_window(app, &position);
    }
}

fn get_overlay_position(app: &AppHandle) -> String {
    use crate::db::DbState;
    if let Some(state) = app.try_state::<DbState>() {
        if let Ok(conn) = state.0.lock() {
            if let Ok(pos) = conn.query_row(
                "SELECT value FROM settings WHERE key = 'overlay_position'",
                [],
                |row| row.get::<_, String>(0),
            ) {
                return pos;
            }
        }
    }
    "bottom-right".to_string()
}

fn create_overlay_window(app: &AppHandle, position: &str) {
    let win_w = 380.0_f64;
    let win_h = 550.0_f64;

    let (x, y) = if let Ok(Some(monitor)) = app.primary_monitor() {
        let size = monitor.size();
        match position {
            "top-left" => (20.0, 20.0),
            "top-right" => (size.width as f64 - win_w - 20.0, 20.0),
            "bottom-left" => (20.0, size.height as f64 - win_h - 60.0),
            _ => (
                size.width as f64 - win_w - 20.0,
                size.height as f64 - win_h - 60.0,
            ),
        }
    } else {
        (100.0, 100.0)
    };

    match tauri::WebviewWindowBuilder::new(
        app,
        "overlay",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Blueprint Tasks")
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .inner_size(win_w, win_h)
    .position(x, y)
    .build()
    {
        Ok(_) => {}
        Err(e) => eprintln!("Failed to create overlay window: {}", e),
    }
}

pub fn create_voice_indicator_window(app: &AppHandle) {
    if app.get_webview_window("voice-indicator").is_some() {
        return;
    }
    let (x, y) = if let Ok(Some(monitor)) = app.primary_monitor() {
        let size = monitor.size();
        (size.width as f64 - 280.0, 20.0)
    } else {
        (100.0, 20.0)
    };

    let _ = tauri::WebviewWindowBuilder::new(
        app,
        "voice-indicator",
        tauri::WebviewUrl::App("index.html".into()),
    )
    .title("Recording")
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .inner_size(260.0, 60.0)
    .position(x, y)
    .build();
}

#[tauri::command]
pub fn toggle_overlay_window(app: AppHandle) -> Result<(), String> {
    toggle_overlay_window_internal(&app);
    Ok(())
}

#[tauri::command]
pub fn update_hotkeys(
    overlay_hotkey: String,
    voice_hotkey: String,
    app: AppHandle,
) -> Result<(), String> {
    let _ = app.global_shortcut().unregister_all();

    if !overlay_hotkey.is_empty() {
        app.global_shortcut()
            .register(overlay_hotkey.as_str())
            .map_err(|e| format!("Неверный формат overlay хоткея '{}': {}", overlay_hotkey, e))?;
    }
    if !voice_hotkey.is_empty() {
        app.global_shortcut()
            .register(voice_hotkey.as_str())
            .map_err(|e| format!("Неверный формат voice хоткея '{}': {}", voice_hotkey, e))?;
    }

    let state = app.state::<HotkeyState>();
    *state.overlay_hotkey.lock().unwrap() = overlay_hotkey;
    *state.voice_hotkey.lock().unwrap() = voice_hotkey;

    Ok(())
}

#[tauri::command]
pub fn pause_hotkeys(app: AppHandle) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn resume_hotkeys(app: AppHandle) -> Result<(), String> {
    let state = app.state::<HotkeyState>();
    let overlay = state.overlay_hotkey.lock().unwrap().clone();
    let voice = state.voice_hotkey.lock().unwrap().clone();
    if !overlay.is_empty() {
        let _ = app.global_shortcut().unregister(overlay.as_str());
        let _ = app.global_shortcut().register(overlay.as_str());
    }
    if !voice.is_empty() {
        let _ = app.global_shortcut().unregister(voice.as_str());
        let _ = app.global_shortcut().register(voice.as_str());
    }
    Ok(())
}

#[tauri::command]
pub fn update_overlay_position(position: String, app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        let win_w = 380.0_f64;
        let win_h = 550.0_f64;
        let (x, y) = if let Ok(Some(monitor)) = app.primary_monitor() {
            let size = monitor.size();
            match position.as_str() {
                "top-left" => (20.0, 20.0),
                "top-right" => (size.width as f64 - win_w - 20.0, 20.0),
                "bottom-left" => (20.0, size.height as f64 - win_h - 60.0),
                _ => (
                    size.width as f64 - win_w - 20.0,
                    size.height as f64 - win_h - 60.0,
                ),
            }
        } else {
            (100.0, 100.0)
        };
        window
            .set_position(tauri::PhysicalPosition::new(x as i32, y as i32))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn show_voice_indicator(app: AppHandle) -> Result<(), String> {
    create_voice_indicator_window(&app);
    if let Some(win) = app.get_webview_window("voice-indicator") {
        let _ = win.show();
    }
    Ok(())
}

#[tauri::command]
pub fn hide_voice_indicator(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("voice-indicator") {
        let _ = win.close();
    }
    Ok(())
}

#[tauri::command]
pub fn emit_voice_message_saved(app: AppHandle) -> Result<(), String> {
    app.emit("voice-message-saved", ()).map_err(|e| e.to_string())
}
