use crate::db::DbState;
use chrono::Utc;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub contact: Option<String>,
    pub payment_type: String,
    pub amount: Option<f64>,
    pub currency: String,
    pub notes: Option<String>,
    pub payment_day: Option<i32>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClientPayment {
    pub id: String,
    pub client_id: String,
    pub period: String,
    pub paid: bool,
    pub paid_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateClientInput {
    pub name: String,
    pub contact: Option<String>,
    pub payment_type: String,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub payment_date: Option<String>,
    pub payment_day: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateClientInput {
    pub id: String,
    pub name: String,
    pub contact: Option<String>,
    pub payment_type: String,
    pub amount: Option<f64>,
    pub currency: Option<String>,
    pub notes: Option<String>,
    pub payment_day: Option<i32>,
}

#[tauri::command]
pub fn get_clients(state: State<DbState>) -> Result<Vec<Client>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, contact, payment_type, amount, currency, notes, payment_day, created_at \
             FROM clients ORDER BY name COLLATE NOCASE",
        )
        .map_err(|e| e.to_string())?;
    let clients = stmt
        .query_map([], |row| {
            Ok(Client {
                id: row.get(0)?,
                name: row.get(1)?,
                contact: row.get(2)?,
                payment_type: row.get(3)?,
                amount: row.get(4)?,
                currency: row.get(5)?,
                notes: row.get(6)?,
                payment_day: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(clients)
}

#[tauri::command]
pub fn create_client(input: CreateClientInput, state: State<DbState>) -> Result<Client, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let currency = input.currency.clone().unwrap_or_else(|| "USD".to_string());

    conn.execute(
        "INSERT INTO clients (id, name, contact, payment_type, amount, currency, notes, payment_day, created_at) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, input.name, input.contact, input.payment_type, input.amount, currency, input.notes, input.payment_day, now],
    )
    .map_err(|e| e.to_string())?;

    if input.payment_type == "onetime" {
        if let Some(date) = &input.payment_date {
            let pid = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO client_payments (id, client_id, period, paid) VALUES (?1, ?2, ?3, 0)",
                params![pid, id, date],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    Ok(Client {
        id,
        name: input.name,
        contact: input.contact,
        payment_type: input.payment_type,
        amount: input.amount,
        currency,
        notes: input.notes,
        payment_day: input.payment_day,
        created_at: now,
    })
}

#[tauri::command]
pub fn update_client(input: UpdateClientInput, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let currency = input.currency.unwrap_or_else(|| "USD".to_string());
    conn.execute(
        "UPDATE clients SET name=?1, contact=?2, payment_type=?3, amount=?4, currency=?5, notes=?6, payment_day=?7 WHERE id=?8",
        params![input.name, input.contact, input.payment_type, input.amount, currency, input.notes, input.payment_day, input.id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_client(id: String, state: State<DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM clients WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_client_payments(
    client_id: String,
    state: State<DbState>,
) -> Result<Vec<ClientPayment>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare(
            "SELECT id, client_id, period, paid, paid_at FROM client_payments \
             WHERE client_id = ?1 ORDER BY period DESC",
        )
        .map_err(|e| e.to_string())?;
    let payments = stmt
        .query_map([&client_id], |row| {
            Ok(ClientPayment {
                id: row.get(0)?,
                client_id: row.get(1)?,
                period: row.get(2)?,
                paid: row.get::<_, i32>(3)? != 0,
                paid_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(payments)
}

#[tauri::command]
pub fn toggle_payment(
    client_id: String,
    period: String,
    paid: bool,
    state: State<DbState>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = if paid {
        Some(Utc::now().to_rfc3339())
    } else {
        None
    };
    conn.execute(
        "INSERT INTO client_payments (id, client_id, period, paid, paid_at) VALUES (?1, ?2, ?3, ?4, ?5) \
         ON CONFLICT(client_id, period) DO UPDATE SET paid = excluded.paid, paid_at = excluded.paid_at",
        params![Uuid::new_v4().to_string(), client_id, period, paid as i32, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
