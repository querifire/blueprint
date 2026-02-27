use crate::db::DbState;
use chrono::NaiveDate;
use tauri::State;
use tauri_plugin_autostart::ManagerExt;

fn days_remaining(expires_at: &str) -> i64 {
    let today = chrono::Local::now().date_naive();
    if let Ok(exp) = NaiveDate::parse_from_str(expires_at, "%Y-%m-%d") {
        (exp - today).num_days()
    } else {
        i64::MAX
    }
}

#[tauri::command]
pub fn check_and_notify(
    state: State<DbState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT service_name, project_name, expires_at, notify_days \
             FROM services",
        )
        .map_err(|e| e.to_string())?;

    struct Row {
        service_name: String,
        project_name: String,
        expires_at: String,
        notify_days: i32,
    }

    let rows: Vec<Row> = stmt
        .query_map([], |row| {
            Ok(Row {
                service_name: row.get(0)?,
                project_name: row.get(1)?,
                expires_at: row.get(2)?,
                notify_days: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    drop(stmt);
    drop(conn);

    use tauri_plugin_notification::NotificationExt;
    for row in rows {
        let days = days_remaining(&row.expires_at);
        if days < 0 || days <= row.notify_days as i64 {
            let title = if days < 0 {
                format!("Истёк: {}", row.service_name)
            } else if days == 0 {
                format!("Истекает сегодня: {}", row.service_name)
            } else {
                format!("Истекает через {} дн: {}", days, row.service_name)
            };
            let body = format!("{} · {}", row.project_name, row.expires_at);
            let _ = app
                .notification()
                .builder()
                .title(&title)
                .body(&body)
                .show();
        }
    }

    Ok(())
}

#[tauri::command]
pub fn toggle_autostart(enable: bool, app: tauri::AppHandle) -> Result<(), String> {
    let autostart = app.autolaunch();
    if enable {
        autostart.enable().map_err(|e| e.to_string())
    } else {
        autostart.disable().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn get_autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}
