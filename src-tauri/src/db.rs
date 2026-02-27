use anyhow::Result;
use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

pub struct DbState(pub Mutex<Connection>);

pub fn init_db(db_path: &Path) -> Result<Connection> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            contact TEXT,
            payment_type TEXT NOT NULL DEFAULT 'monthly',
            amount REAL,
            currency TEXT NOT NULL DEFAULT 'RUB',
            notes TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS client_payments (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
            period TEXT NOT NULL,
            paid INTEGER NOT NULL DEFAULT 0,
            paid_at TEXT,
            UNIQUE(client_id, period)
        );

        CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY,
            project_name TEXT NOT NULL,
            service_name TEXT NOT NULL,
            login TEXT,
            url TEXT,
            expires_at TEXT NOT NULL,
            cost REAL,
            currency TEXT NOT NULL DEFAULT 'USD',
            notes TEXT,
            category TEXT,
            notify_days INTEGER NOT NULL DEFAULT 7,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#1a73e8'
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('overlay_hotkey', 'Ctrl+Shift+B');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('voice_hotkey', 'Ctrl+Shift+V');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('overlay_position', 'bottom-right');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('notify_days_before', '7');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_provider', 'openai');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_model', 'gpt-4o-mini');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_base_url', '');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_api_key', '');
        INSERT OR IGNORE INTO settings (key, value) VALUES ('autostart', 'false');
        ",
    )?;

    let has_payment_day: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('clients') WHERE name='payment_day'",
            [],
            |row| row.get::<_, i32>(0),
        )
        .unwrap_or(0)
        > 0;
    if !has_payment_day {
        conn.execute_batch("ALTER TABLE clients ADD COLUMN payment_day INTEGER;")?;
    }

    Ok(())
}
