use crate::db::DbState;
use chrono::{Duration, Utc};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Service {
    pub id: String,
    pub project_name: String,
    pub service_name: String,
    pub login: Option<String>,
    pub url: Option<String>,
    pub expires_at: String,
    pub cost: Option<f64>,
    pub currency: String,
    pub notes: Option<String>,
    pub category: Option<String>,
    pub notify_days: i32,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateServiceInput {
    pub project_name: String,
    pub service_name: String,
    pub login: Option<String>,
    pub url: Option<String>,
    pub expires_at: Option<String>,
    pub cost: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub category: Option<String>,
    pub notify_days: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateServiceInput {
    pub id: String,
    pub project_name: String,
    pub service_name: String,
    pub login: Option<String>,
    pub url: Option<String>,
    pub expires_at: String,
    pub cost: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub category: Option<String>,
    pub notify_days: Option<i32>,
}

#[tauri::command]
pub fn get_services(state: State<DbState>) -> Result<Vec<Service>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, project_name, service_name, login, url, expires_at, cost, currency, \
             notes, category, notify_days, created_at FROM services ORDER BY expires_at ASC",
        )
        .map_err(|e| e.to_string())?;
    let services = stmt
        .query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                project_name: row.get(1)?,
                service_name: row.get(2)?,
                login: row.get(3)?,
                url: row.get(4)?,
                expires_at: row.get(5)?,
                cost: row.get(6)?,
                currency: row.get(7)?,
                notes: row.get(8)?,
                category: row.get(9)?,
                notify_days: row.get(10)?,
                created_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(services)
}

#[tauri::command]
pub fn create_service(
    input: CreateServiceInput,
    state: State<DbState>,
) -> Result<Service, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let currency = input.currency.clone().unwrap_or_else(|| "USD".to_string());
    let notify_days = input.notify_days.unwrap_or(7);
    let expires_at = input.expires_at.clone().unwrap_or_else(|| {
        (Utc::now() + Duration::days(365)).format("%Y-%m-%d").to_string()
    });

    conn.execute(
        "INSERT INTO services (id, project_name, service_name, login, url, expires_at, cost, \
         currency, notes, category, notify_days, created_at) VALUES \
         (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        params![
            id, input.project_name, input.service_name, input.login, input.url,
            expires_at, input.cost, currency, input.notes, input.category,
            notify_days, now
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(Service {
        id,
        project_name: input.project_name,
        service_name: input.service_name,
        login: input.login,
        url: input.url,
        expires_at,
        cost: input.cost,
        currency,
        notes: input.notes,
        category: input.category,
        notify_days,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_service(input: UpdateServiceInput, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());
    let notify_days = input.notify_days.unwrap_or(7);
    conn.execute(
        "UPDATE services SET project_name=?1, service_name=?2, login=?3, url=?4, \
         expires_at=?5, cost=?6, currency=?7, notes=?8, category=?9, notify_days=?10 WHERE id=?11",
        params![
            input.project_name, input.service_name, input.login, input.url,
            input.expires_at, input.cost, currency, input.notes, input.category,
            notify_days, input.id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_service(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM services WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
