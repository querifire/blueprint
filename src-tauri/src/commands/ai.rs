use crate::db::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatInput {
    pub messages: Vec<AiMessage>,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub base_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ChatResponse {
    pub content: String,
    pub actions: Vec<serde_json::Value>,
}

const SYSTEM_PROMPT: &str = r#"Ты Blueprint — персональный ассистент для управления клиентами, сервисами и заметками. 

Когда пользователь просит что-то сделать, ответь ТОЛЬКО JSON-объектом (без markdown, без пояснений):
{
  "actions": [
    { "action": "<действие>", "data": { ... } }
  ],
  "message": "<дружелюбное подтверждение на русском>"
}

Если нужно создать несколько сущностей — включи несколько объектов в массив actions.
Например, "создай 3 клиента" → массив из 3 объектов add_client.

Доступные действия:
- "add_client": data: { name, contact?, payment_type("monthly"|"onetime"), amount?, currency?("RUB"), notes?, payment_date?(YYYY-MM-DD для разового) }
- "add_service": data: { project_name, service_name, login?, url?, expires_at?(YYYY-MM-DD), cost?, currency?("USD"), notes?, category? }
- "add_note": data: { title, content?, category? } или data: { items: [{ title, content?, category? }, ...] } или data: { by_category: { "<категория>": ["заметка 1", "заметка 2"] } }
- "complete_note": data: { title_query }
- "mark_payment": data: { client_name, period(YYYY-MM), paid(true|false) }
- "none": просто общение, data: {}

Если пользователь просто общается или задаёт вопрос — используй один action "none".
Если пользователь дал список заметок, создавай отдельную заметку на каждый пункт.
Если пользователь просит разные категории для разных заметок, передавай category для каждого пункта.
Текущая дата: "#;

fn get_system_prompt() -> String {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    format!("{}{}", SYSTEM_PROMPT, today)
}

fn get_setting(conn: &rusqlite::Connection, key: &str) -> String {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        [key],
        |row| row.get::<_, String>(0),
    )
    .unwrap_or_default()
}

#[tauri::command]
pub async fn chat_with_ai(
    input: ChatInput,
    state: State<'_, DbState>,
) -> Result<ChatResponse, String> {
    let (provider, model, base_url, api_key) = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let provider = input
            .provider
            .clone()
            .unwrap_or_else(|| get_setting(&conn, "ai_provider"));
        let model = input
            .model
            .clone()
            .unwrap_or_else(|| get_setting(&conn, "ai_model"));
        let base_url = input
            .base_url
            .clone()
            .unwrap_or_else(|| get_setting(&conn, "ai_base_url"));
        let api_key = get_setting(&conn, "ai_api_key");
        (provider, model, base_url, api_key)
    };

    if api_key.is_empty() && provider != "local" {
        return Err("API ключ не настроен. Перейди в Настройки и добавь ключ.".to_string());
    }

    let mut messages = vec![serde_json::json!({
        "role": "system",
        "content": get_system_prompt()
    })];

    for msg in &input.messages {
        messages.push(serde_json::json!({
            "role": msg.role,
            "content": msg.content
        }));
    }

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .map_err(|e| e.to_string())?;

    let response_text = match provider.as_str() {
        "anthropic" => {
            call_anthropic(&client, &api_key, &model, &input.messages).await?
        }
        "gemini" => {
            call_gemini(&client, &api_key, &model, &input.messages).await?
        }
        _ => {
            let url = if provider == "local" && !base_url.is_empty() {
                format!("{}/v1/chat/completions", base_url.trim_end_matches('/'))
            } else {
                "https://api.openai.com/v1/chat/completions".to_string()
            };
            call_openai_compatible(&client, &api_key, &model, &messages, &url).await?
        }
    };

    let trimmed = response_text.trim();
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(trimmed) {
        let message = parsed["message"]
            .as_str()
            .unwrap_or(trimmed)
            .to_string();

        let actions: Vec<serde_json::Value> = if let Some(arr) = parsed["actions"].as_array() {
            arr.iter()
                .filter(|a| a["action"].as_str().unwrap_or("none") != "none")
                .cloned()
                .collect()
        } else if parsed["action"].as_str().unwrap_or("none") != "none" {
            vec![parsed.clone()]
        } else {
            vec![]
        };

        return Ok(ChatResponse {
            content: message,
            actions,
        });
    }

    Ok(ChatResponse {
        content: response_text,
        actions: vec![],
    })
}

async fn call_openai_compatible(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    messages: &[serde_json::Value],
    url: &str,
) -> Result<String, String> {
    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 4096,
    });

    let mut req = client.post(url).json(&body);
    if !api_key.is_empty() {
        req = req.bearer_auth(api_key);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("AI API ошибка {}: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string())
}

async fn call_anthropic(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
) -> Result<String, String> {
    let anthropic_messages: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| serde_json::json!({ "role": m.role, "content": m.content }))
        .collect();

    let body = serde_json::json!({
        "model": model,
        "system": get_system_prompt(),
        "messages": anthropic_messages,
        "max_tokens": 4096,
    });

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Anthropic API ошибка {}: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json["content"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string())
}

async fn call_gemini(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    messages: &[AiMessage],
) -> Result<String, String> {
    let contents: Vec<serde_json::Value> = messages
        .iter()
        .map(|m| {
            let role = if m.role == "assistant" { "model" } else { "user" };
            serde_json::json!({
                "role": role,
                "parts": [{ "text": m.content }]
            })
        })
        .collect();

    let body = serde_json::json!({
        "system_instruction": { "parts": [{ "text": get_system_prompt() }] },
        "contents": contents,
        "generationConfig": { "maxOutputTokens": 4096, "temperature": 0.3 }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let resp = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Gemini API ошибка {}: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .unwrap_or("")
        .to_string())
}

#[tauri::command]
pub async fn transcribe_audio(
    audio_base64: String,
    state: State<'_, DbState>,
) -> Result<String, String> {
    let (voice_provider, api_key) = {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let provider = conn.query_row(
            "SELECT value FROM settings WHERE key = 'voice_provider'",
            [],
            |row| row.get::<_, String>(0),
        ).unwrap_or_else(|_| "openai".to_string());

        let key_field = if provider == "groq" { "groq_api_key" } else { "ai_api_key" };
        let key = conn.query_row(
            &format!("SELECT value FROM settings WHERE key = '{}'", key_field),
            [],
            |row| row.get::<_, String>(0),
        ).unwrap_or_default();

        (provider, key)
    };

    if api_key.is_empty() {
        return Err(if voice_provider == "groq" {
            "Groq API ключ не настроен. Добавьте его в Настройки → Голосовой ввод.".to_string()
        } else {
            "API ключ не настроен".to_string()
        });
    }

    let audio_bytes = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        &audio_base64,
    )
    .map_err(|e| e.to_string())?;

    let (endpoint, model) = if voice_provider == "groq" {
        (
            "https://api.groq.com/openai/v1/audio/transcriptions".to_string(),
            "whisper-large-v3-turbo".to_string(),
        )
    } else {
        (
            "https://api.openai.com/v1/audio/transcriptions".to_string(),
            "whisper-1".to_string(),
        )
    };

    let client = reqwest::Client::new();
    let part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name("audio.webm")
        .mime_str("audio/webm")
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new()
        .part("file", part)
        .text("model", model)
        .text("language", "ru");

    let resp = client
        .post(&endpoint)
        .bearer_auth(&api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Whisper API ошибка {}: {}", status, text));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(json["text"].as_str().unwrap_or("").to_string())
}
