use crate::db::DbState;
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::State;

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: String,
    pub overlay_hotkey: String,
    pub voice_hotkey: String,
    pub overlay_position: String,
    pub notify_days_before: String,
    pub ai_provider: String,
    pub ai_model: String,
    pub ai_base_url: String,
}

#[tauri::command]
pub fn get_settings(state: State<DbState>) -> Result<HashMap<String, String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;
    let map = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(map)
}

#[tauri::command]
pub fn save_setting(key: String, value: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_ai_key(state: State<DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'ai_api_key'",
        [],
        |row| row.get(0),
    );
    Ok(result.unwrap_or_default())
}

#[tauri::command]
pub fn save_ai_key(key: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('ai_api_key', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_groq_key(state: State<DbState>) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let result: Result<String, _> = conn.query_row(
        "SELECT value FROM settings WHERE key = 'groq_api_key'",
        [],
        |row| row.get(0),
    );
    Ok(result.unwrap_or_default())
}

#[tauri::command]
pub fn save_groq_key(key: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES ('groq_api_key', ?1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_chat_history(
    limit: Option<i32>,
    state: State<DbState>,
) -> Result<Vec<serde_json::Value>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let lim = limit.unwrap_or(50);
    let mut stmt = conn
        .prepare(
            "SELECT id, role, content, created_at FROM chat_history ORDER BY created_at DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let messages: Vec<serde_json::Value> = stmt
        .query_map([lim], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "role": row.get::<_, String>(1)?,
                "content": row.get::<_, String>(2)?,
                "created_at": row.get::<_, String>(3)?,
            }))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    Ok(messages)
}

#[tauri::command]
pub fn save_chat_message(
    role: String,
    content: String,
    state: State<DbState>,
) -> Result<String, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO chat_history (id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, role, content, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn clear_chat_history(state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM chat_history", [])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileExport {
    pub version: i32,
    pub exported_at: String,
    pub settings: Vec<HashMap<String, serde_json::Value>>,
    pub clients: Vec<HashMap<String, serde_json::Value>>,
    pub client_payments: Vec<HashMap<String, serde_json::Value>>,
    pub services: Vec<HashMap<String, serde_json::Value>>,
    pub categories: Vec<HashMap<String, serde_json::Value>>,
    pub notes: Vec<HashMap<String, serde_json::Value>>,
    pub chat_history: Vec<HashMap<String, serde_json::Value>>,
}

#[tauri::command]
pub fn export_profile(state: State<DbState>) -> Result<ProfileExport, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;

    let settings = {
        let mut stmt = conn
            .prepare("SELECT key, value FROM settings ORDER BY key")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert(
                "key".to_string(),
                serde_json::Value::String(row.get::<_, String>(0)?),
            );
            m.insert(
                "value".to_string(),
                serde_json::Value::String(row.get::<_, String>(1)?),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let clients = {
        let mut stmt = conn
            .prepare(
                "SELECT id, name, contact, payment_type, amount, currency, notes, payment_day, created_at FROM clients",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert("name".to_string(), serde_json::Value::String(row.get(1)?));
            m.insert(
                "contact".to_string(),
                row.get::<_, Option<String>>(2)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "payment_type".to_string(),
                serde_json::Value::String(row.get(3)?),
            );
            m.insert(
                "amount".to_string(),
                row.get::<_, Option<f64>>(4)?
                    .and_then(serde_json::Number::from_f64)
                    .map(serde_json::Value::Number)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert("currency".to_string(), serde_json::Value::String(row.get(5)?));
            m.insert(
                "notes".to_string(),
                row.get::<_, Option<String>>(6)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "payment_day".to_string(),
                row.get::<_, Option<i32>>(7)?
                    .map(|v| serde_json::Value::Number(serde_json::Number::from(v)))
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "created_at".to_string(),
                serde_json::Value::String(row.get(8)?),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let client_payments = {
        let mut stmt = conn
            .prepare("SELECT id, client_id, period, paid, paid_at FROM client_payments")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert(
                "client_id".to_string(),
                serde_json::Value::String(row.get(1)?),
            );
            m.insert("period".to_string(), serde_json::Value::String(row.get(2)?));
            m.insert(
                "paid".to_string(),
                serde_json::Value::Number(serde_json::Number::from(row.get::<_, i32>(3)?)),
            );
            m.insert(
                "paid_at".to_string(),
                row.get::<_, Option<String>>(4)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let services = {
        let mut stmt = conn
            .prepare(
                "SELECT id, project_name, service_name, login, url, expires_at, cost, currency, notes, category, notify_days, created_at FROM services",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert(
                "project_name".to_string(),
                serde_json::Value::String(row.get(1)?),
            );
            m.insert(
                "service_name".to_string(),
                serde_json::Value::String(row.get(2)?),
            );
            m.insert(
                "login".to_string(),
                row.get::<_, Option<String>>(3)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "url".to_string(),
                row.get::<_, Option<String>>(4)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "expires_at".to_string(),
                serde_json::Value::String(row.get(5)?),
            );
            m.insert(
                "cost".to_string(),
                row.get::<_, Option<f64>>(6)?
                    .and_then(serde_json::Number::from_f64)
                    .map(serde_json::Value::Number)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert("currency".to_string(), serde_json::Value::String(row.get(7)?));
            m.insert(
                "notes".to_string(),
                row.get::<_, Option<String>>(8)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "category".to_string(),
                row.get::<_, Option<String>>(9)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "notify_days".to_string(),
                serde_json::Value::Number(serde_json::Number::from(row.get::<_, i32>(10)?)),
            );
            m.insert(
                "created_at".to_string(),
                serde_json::Value::String(row.get(11)?),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let categories = {
        let mut stmt = conn
            .prepare("SELECT id, name, color FROM categories")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert("name".to_string(), serde_json::Value::String(row.get(1)?));
            m.insert("color".to_string(), serde_json::Value::String(row.get(2)?));
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let notes = {
        let mut stmt = conn
            .prepare(
                "SELECT id, title, content, category_id, completed, sort_order, created_at, updated_at FROM notes",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert("title".to_string(), serde_json::Value::String(row.get(1)?));
            m.insert(
                "content".to_string(),
                row.get::<_, Option<String>>(2)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "category_id".to_string(),
                row.get::<_, Option<String>>(3)?
                    .map(serde_json::Value::String)
                    .unwrap_or(serde_json::Value::Null),
            );
            m.insert(
                "completed".to_string(),
                serde_json::Value::Number(serde_json::Number::from(row.get::<_, i32>(4)?)),
            );
            m.insert(
                "sort_order".to_string(),
                serde_json::Value::Number(serde_json::Number::from(row.get::<_, i32>(5)?)),
            );
            m.insert(
                "created_at".to_string(),
                serde_json::Value::String(row.get(6)?),
            );
            m.insert(
                "updated_at".to_string(),
                serde_json::Value::String(row.get(7)?),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    let chat_history = {
        let mut stmt = conn
            .prepare("SELECT id, role, content, created_at FROM chat_history")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
            let mut m = HashMap::new();
            m.insert("id".to_string(), serde_json::Value::String(row.get(0)?));
            m.insert("role".to_string(), serde_json::Value::String(row.get(1)?));
            m.insert("content".to_string(), serde_json::Value::String(row.get(2)?));
            m.insert(
                "created_at".to_string(),
                serde_json::Value::String(row.get(3)?),
            );
            Ok(m)
        })
            .map_err(|e| e.to_string())?;
        rows.filter_map(|r| r.ok()).collect::<Vec<_>>()
    };

    Ok(ProfileExport {
        version: 1,
        exported_at: Utc::now().to_rfc3339(),
        settings,
        clients,
        client_payments,
        services,
        categories,
        notes,
        chat_history,
    })
}

#[tauri::command]
pub fn import_profile(payload: ProfileExport, state: State<DbState>) -> Result<(), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM client_payments", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM clients", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM services", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM notes", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM categories", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM chat_history", [])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM settings", [])
        .map_err(|e| e.to_string())?;

    for item in payload.settings {
        let key = item
            .get("key")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Некорректный ключ settings".to_string())?;
        let value = item
            .get("value")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "Некорректное значение settings".to_string())?;
        tx.execute(
            "INSERT INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.clients {
        tx.execute(
            "INSERT INTO clients (id, name, contact, payment_type, amount, currency, notes, payment_day, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("name").and_then(|v| v.as_str()),
                item.get("contact").and_then(|v| v.as_str()),
                item.get("payment_type").and_then(|v| v.as_str()),
                item.get("amount").and_then(|v| v.as_f64()),
                item.get("currency").and_then(|v| v.as_str()),
                item.get("notes").and_then(|v| v.as_str()),
                item.get("payment_day").and_then(|v| v.as_i64()).map(|v| v as i32),
                item.get("created_at").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.client_payments {
        tx.execute(
            "INSERT INTO client_payments (id, client_id, period, paid, paid_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("client_id").and_then(|v| v.as_str()),
                item.get("period").and_then(|v| v.as_str()),
                item.get("paid").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                item.get("paid_at").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.services {
        tx.execute(
            "INSERT INTO services (id, project_name, service_name, login, url, expires_at, cost, currency, notes, category, notify_days, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("project_name").and_then(|v| v.as_str()),
                item.get("service_name").and_then(|v| v.as_str()),
                item.get("login").and_then(|v| v.as_str()),
                item.get("url").and_then(|v| v.as_str()),
                item.get("expires_at").and_then(|v| v.as_str()),
                item.get("cost").and_then(|v| v.as_f64()),
                item.get("currency").and_then(|v| v.as_str()),
                item.get("notes").and_then(|v| v.as_str()),
                item.get("category").and_then(|v| v.as_str()),
                item.get("notify_days").and_then(|v| v.as_i64()).unwrap_or(7) as i32,
                item.get("created_at").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.categories {
        tx.execute(
            "INSERT INTO categories (id, name, color) VALUES (?1, ?2, ?3)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("name").and_then(|v| v.as_str()),
                item.get("color").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.notes {
        tx.execute(
            "INSERT INTO notes (id, title, content, category_id, completed, sort_order, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("title").and_then(|v| v.as_str()),
                item.get("content").and_then(|v| v.as_str()),
                item.get("category_id").and_then(|v| v.as_str()),
                item.get("completed").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                item.get("sort_order").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
                item.get("created_at").and_then(|v| v.as_str()),
                item.get("updated_at").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    for item in payload.chat_history {
        tx.execute(
            "INSERT INTO chat_history (id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
            params![
                item.get("id").and_then(|v| v.as_str()),
                item.get("role").and_then(|v| v.as_str()),
                item.get("content").and_then(|v| v.as_str()),
                item.get("created_at").and_then(|v| v.as_str()),
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
