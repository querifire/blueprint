mod commands;
mod db;
mod hotkeys;

use db::DbState;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;
            let db_path = app_data_dir.join("blueprint.db");
            let conn = db::init_db(&db_path).map_err(|e| e.to_string())?;
            app.manage(DbState(Mutex::new(conn)));

            let show_i = MenuItem::with_id(app, "show", "Показать Blueprint", true, None::<&str>)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_i = MenuItem::with_id(app, "quit", "Выйти", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &sep, &quit_i])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("Blueprint")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.unminimize();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(w) = app.get_webview_window("main") {
                            if w.is_visible().unwrap_or(false) {
                                let _ = w.hide();
                            } else {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            if let Some(main_win) = app.get_webview_window("main") {
                let handle = app.handle().clone();
                main_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(w) = handle.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                });
            }

            hotkeys::register_shortcuts(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::clients::get_clients,
            commands::clients::create_client,
            commands::clients::update_client,
            commands::clients::delete_client,
            commands::clients::get_client_payments,
            commands::clients::toggle_payment,
            commands::services::get_services,
            commands::services::create_service,
            commands::services::update_service,
            commands::services::delete_service,
            commands::notes::get_notes,
            commands::notes::create_note,
            commands::notes::update_note,
            commands::notes::delete_note,
            commands::notes::toggle_note,
            commands::notes::get_categories,
            commands::notes::create_category,
            commands::notes::update_category,
            commands::notes::delete_category,
            commands::notes::get_incomplete_notes,
            commands::ai::chat_with_ai,
            commands::ai::transcribe_audio,
            commands::settings::get_settings,
            commands::settings::save_setting,
            commands::settings::get_ai_key,
            commands::settings::save_ai_key,
            commands::settings::get_groq_key,
            commands::settings::save_groq_key,
            commands::settings::get_chat_history,
            commands::settings::save_chat_message,
            commands::settings::clear_chat_history,
            commands::settings::export_profile,
            commands::settings::import_profile,
            hotkeys::toggle_overlay_window,
            hotkeys::update_hotkeys,
            hotkeys::pause_hotkeys,
            hotkeys::resume_hotkeys,
            hotkeys::update_overlay_position,
            hotkeys::show_voice_indicator,
            hotkeys::hide_voice_indicator,
            hotkeys::emit_voice_message_saved,
            commands::notifications::check_and_notify,
            commands::notifications::toggle_autostart,
            commands::notifications::get_autostart_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
