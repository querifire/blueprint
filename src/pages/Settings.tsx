import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Switch,
  useTheme,
  Chip,
} from "@mui/material";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import BrightnessAutoOutlinedIcon from "@mui/icons-material/BrightnessAutoOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../stores/settingsStore";

interface ProfileExport {
  version: number;
  exported_at: string;
  settings: Array<Record<string, unknown>>;
  clients: Array<Record<string, unknown>>;
  client_payments: Array<Record<string, unknown>>;
  services: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  chat_history: Array<Record<string, unknown>>;
}

const AI_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT)" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "gemini", label: "Google Gemini" },
  { value: "local", label: "Локальный LLM (LM Studio / Ollama)" },
];

const AI_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  ],
  gemini: [
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-pro", label: "Gemini Pro" },
  ],
  local: [
    { value: "llama3", label: "Llama 3" },
    { value: "mistral", label: "Mistral" },
    { value: "qwen2", label: "Qwen 2" },
    { value: "custom", label: "Custom (ввести вручную)" },
  ],
};

function buildHotkeyString(e: React.KeyboardEvent): string | null {
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  if (e.metaKey) parts.push("Meta");
  const key = e.code.startsWith("Key")
    ? e.code.slice(3)
    : e.code.startsWith("Digit")
    ? e.code.slice(5)
    : e.key.length === 1
    ? e.key.toUpperCase()
    : e.key;
  if (!key) return null;
  parts.push(key);
  return parts.join("+");
}

function HotkeyCapture({
  label,
  value,
  onChange,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const [capturing, setCapturing] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const startCapture = async () => {
    await invoke("pause_hotkeys").catch(() => {});
    setCapturing(true);
    setTimeout(() => boxRef.current?.focus(), 0);
  };

  const stopCapture = () => {
    setCapturing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const combo = buildHotkeyString(e);
    if (combo) {
      onChange(combo);
      stopCapture();
    }
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: isDark ? "#8e8ea0" : "#6e6e80",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Box
        ref={boxRef}
        tabIndex={0}
        onClick={capturing ? undefined : startCapture}
        onBlur={capturing ? stopCapture : undefined}
        onKeyDown={capturing ? handleKeyDown : undefined}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          minWidth: 200,
          borderRadius: "10px",
          border: `1.5px solid ${
            capturing
              ? "#6366f1"
              : isDark
              ? "#3a3a3a"
              : "#e0e0e0"
          }`,
          backgroundColor: capturing
            ? isDark
              ? "rgba(99,102,241,0.08)"
              : "rgba(99,102,241,0.04)"
            : isDark
            ? "#2a2a2a"
            : "#fafafa",
          cursor: capturing ? "default" : "pointer",
          outline: "none",
          transition: "border-color 0.15s, background-color 0.15s",
          "&:hover": capturing
            ? {}
            : {
                borderColor: isDark ? "#555" : "#bbb",
              },
          userSelect: "none",
        }}
      >
        {capturing ? (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "#6366f1",
              fontStyle: "italic",
              lineHeight: 1,
            }}
          >
            Нажмите сочетание...
          </Typography>
        ) : value ? (
          value.split("+").map((part) => (
            <Chip
              key={part}
              label={part}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.75rem",
                fontWeight: 700,
                fontFamily: "monospace",
                backgroundColor: isDark ? "#333" : "#eeeeee",
                color: isDark ? "#ccc" : "#333",
                borderRadius: "5px",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          ))
        ) : (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: isDark ? "#5e5e72" : "#c0c0cc",
              lineHeight: 1,
            }}
          >
            Нажмите для записи
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: isDark ? "#6e6e80" : "#acacbe",
        mb: 2,
      }}
    >
      {children}
    </Typography>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Typography
      sx={{
        fontSize: "1.0625rem",
        fontWeight: 700,
        color: isDark ? "#ececec" : "#0d0d0d",
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

function SectionDesc({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Typography
      sx={{
        fontSize: "0.9rem",
        color: isDark ? "#6e6e80" : "#8e8ea0",
        mb: 2.5,
        lineHeight: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

const VOICE_PROVIDERS = [
  {
    value: "groq",
    label: "Groq Whisper — рекомендуется",
    desc: "Whisper на серверах Groq — в ~10× быстрее OpenAI. Бесплатный ключ на console.groq.com.",
  },
  {
    value: "openai",
    label: "OpenAI Whisper",
    desc: "Стандартная транскрипция через OpenAI. Использует тот же API ключ что и AI.",
  },
];

export default function Settings() {
  const {
    theme,
    overlayHotkey,
    voiceHotkey,
    overlayPosition,
    notifyDaysBefore,
    aiProvider,
    aiModel,
    aiBaseUrl,
    voiceProvider,
    loadSettings,
    saveSetting,
    setTheme,
  } = useSettingsStore();

  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === "dark";

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [localOverlayHotkey, setLocalOverlayHotkey] = useState(overlayHotkey);
  const [localVoiceHotkey, setLocalVoiceHotkey] = useState(voiceHotkey);
  const [localProvider, setLocalProvider] = useState(aiProvider);
  const [localModel, setLocalModel] = useState(aiModel);
  const [localCustomModel, setLocalCustomModel] = useState("");
  const [localBaseUrl, setLocalBaseUrl] = useState(aiBaseUrl);
  const [localVoiceProvider, setLocalVoiceProvider] = useState(voiceProvider);
  const [groqKey, setGroqKey] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
    open: false, msg: "", severity: "success",
  });
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const isCustomModel =
    localProvider === "local" &&
    !AI_MODELS["local"].some((m) => m.value === localModel && m.value !== "custom");

  useEffect(() => {
    loadSettings();
    invoke<string>("get_ai_key").then((k) => setApiKey(k || ""));
    invoke<string>("get_groq_key").then((k) => setGroqKey(k || "")).catch(() => {});
    invoke<boolean>("get_autostart_enabled").then((v) => setAutostartEnabled(v)).catch(() => {});
    return () => {
      invoke("resume_hotkeys").catch(() => {});
    };
  }, [loadSettings]);

  const handleAutostartToggle = async (enabled: boolean) => {
    try {
      await invoke("toggle_autostart", { enable: enabled });
      setAutostartEnabled(enabled);
      await saveSetting("autostart", enabled ? "true" : "false");
      setSnack({ open: true, msg: enabled ? "Автозапуск включён" : "Автозапуск отключён", severity: "success" });
    } catch (e) {
      setSnack({ open: true, msg: `Ошибка: ${e}`, severity: "error" });
    }
  };

  useEffect(() => {
    setLocalOverlayHotkey(overlayHotkey);
    setLocalVoiceHotkey(voiceHotkey);
    setLocalProvider(aiProvider);
    if (aiProvider === "local" && !AI_MODELS["local"].some((m) => m.value === aiModel)) {
      setLocalModel("custom");
      setLocalCustomModel(aiModel);
    } else {
      setLocalModel(aiModel);
    }
    setLocalBaseUrl(aiBaseUrl);
    setLocalVoiceProvider(voiceProvider);
  }, [overlayHotkey, voiceHotkey, aiProvider, aiModel, aiBaseUrl, voiceProvider]);

  const handleSaveAi = async () => {
    try {
      const effectiveModel =
        localProvider === "local" && localModel === "custom"
          ? localCustomModel.trim() || "custom"
          : localModel;
      await saveSetting("ai_provider", localProvider);
      await saveSetting("ai_model", effectiveModel);
      await saveSetting("ai_base_url", localBaseUrl);
      if (apiKey !== "") await invoke("save_ai_key", { key: apiKey });
      setSnack({ open: true, msg: "Сохранено", severity: "success" });
    } catch {
      setSnack({ open: true, msg: "Ошибка при сохранении", severity: "error" });
    }
  };

  const handleSaveHotkeys = async () => {
    try {
      await invoke("update_hotkeys", {
        overlayHotkey: localOverlayHotkey,
        voiceHotkey: localVoiceHotkey,
      });
      await saveSetting("overlay_hotkey", localOverlayHotkey);
      await saveSetting("voice_hotkey", localVoiceHotkey);
      setSnack({ open: true, msg: "Хоткеи обновлены", severity: "success" });
    } catch (e) {
      setSnack({ open: true, msg: `Ошибка: ${e}`, severity: "error" });
    }
  };

  const handleSaveVoice = async () => {
    try {
      await saveSetting("voice_provider", localVoiceProvider);
      if (localVoiceProvider === "groq" && groqKey !== "") {
        await invoke("save_groq_key", { key: groqKey });
      }
      setSnack({ open: true, msg: "Настройки голосового ввода сохранены", severity: "success" });
    } catch {
      setSnack({ open: true, msg: "Ошибка при сохранении", severity: "error" });
    }
  };

  const handleOverlayPositionChange = async (pos: string) => {
    await saveSetting("overlay_position", pos);
    await invoke("update_overlay_position", { position: pos }).catch(() => {});
  };

  const handleExportProfile = async () => {
    try {
      const data = await invoke<ProfileExport>("export_profile");
      const text = JSON.stringify(data, null, 2);
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `blueprint-profile-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSnack({ open: true, msg: "Профиль экспортирован", severity: "success" });
    } catch (e) {
      setSnack({ open: true, msg: `Ошибка экспорта: ${e}`, severity: "error" });
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as ProfileExport;
      await invoke("import_profile", { payload });
      await loadSettings();
      setSnack({ open: true, msg: "Профиль импортирован. Перезагрузка...", severity: "success" });
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setSnack({ open: true, msg: `Ошибка импорта: ${err}`, severity: "error" });
    }
  };

  const sectionBorder = isDark ? "#2a2a2a" : "#eeeeee";

  return (
    <Box
      sx={{
        overflow: "auto",
        height: "100%",
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          px: { xs: 3, sm: 4, md: 5 },
          py: 3,
          borderBottom: `1px solid ${sectionBorder}`,
        }}
      >
        <Typography
          sx={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: isDark ? "#ececec" : "#0d0d0d",
            letterSpacing: "-0.01em",
          }}
        >
          Настройки
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: isDark ? "#6e6e80" : "#8e8ea0", mt: 0.5 }}>
          Конфигурация Blueprint
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "240px 1fr", lg: "280px 1fr" },
          px: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <Box sx={{ py: 3.5, pr: { md: 4 }, borderBottom: `1px solid ${sectionBorder}` }}>
          <SectionLabel>Интерфейс</SectionLabel>
          <SectionTitle>Внешний вид</SectionTitle>
          <SectionDesc>Выбери тему оформления</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <ToggleButtonGroup
            value={theme}
            exclusive
            onChange={(_, v) => v && setTheme(v)}
          >
            <ToggleButton value="light">
              <LightModeOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
              Светлая
            </ToggleButton>
            <ToggleButton value="system">
              <BrightnessAutoOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
              Авто
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeOutlinedIcon sx={{ mr: 1, fontSize: 16 }} />
              Тёмная
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            py: 3.5,
            pr: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
          }}
        >
          <SectionLabel>AI</SectionLabel>
          <SectionTitle>Искусственный интеллект</SectionTitle>
          <SectionDesc>Настройки провайдера и модели</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              maxWidth: 640,
            }}
          >
            <FormControl>
              <InputLabel>Провайдер</InputLabel>
              <Select
                value={localProvider}
                label="Провайдер"
                onChange={(e) => {
                  const prov = e.target.value;
                  setLocalProvider(prov);
                  setLocalModel(AI_MODELS[prov]?.[0]?.value || "");
                  setLocalCustomModel("");
                }}
              >
                {AI_PROVIDERS.map((p) => (
                  <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Модель</InputLabel>
              <Select
                value={localModel}
                label="Модель"
                onChange={(e) => {
                  setLocalModel(e.target.value);
                  if (e.target.value !== "custom") setLocalCustomModel("");
                }}
              >
                {(AI_MODELS[localProvider] || []).map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {localProvider === "local" && localModel === "custom" && (
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <TextField
                  fullWidth
                  label="Название модели"
                  value={localCustomModel}
                  onChange={(e) => setLocalCustomModel(e.target.value)}
                  placeholder="например: llama3.2, phi-4, deepseek-r1"
                  helperText="Введи точное название модели из LM Studio / Ollama"
                />
              </Box>
            )}

            {(localProvider !== "local" || isCustomModel || localModel === "custom") && (
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <TextField
                  fullWidth
                  label={localProvider === "local" ? "API Ключ (если требуется)" : "API Ключ"}
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={localProvider === "local" ? "lm-studio (опционально)" : "sk-..."}
                  helperText={
                    localProvider === "local"
                      ? "LM Studio поддерживает OpenAI-совместимый API ключ"
                      : undefined
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyOutlinedIcon sx={{ fontSize: 16, color: isDark ? "#4a4a5a" : "#c5c5d2" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowKey((s) => !s)}>
                          {showKey
                            ? <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />
                            : <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {(localProvider === "local" || localProvider === "openai") && (
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <TextField
                  fullWidth
                  label="Base URL"
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  placeholder="http://localhost:1234"
                  helperText={
                    localProvider === "local"
                      ? "URL LM Studio или Ollama (например http://localhost:1234)"
                      : "Оставь пустым для стандартного API"
                  }
                />
              </Box>
            )}

            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <Button variant="contained" onClick={handleSaveAi}>
                Сохранить
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 3.5, pr: { md: 4 }, borderBottom: `1px solid ${sectionBorder}` }}>
          <SectionLabel>Голос</SectionLabel>
          <SectionTitle>Голосовой ввод</SectionTitle>
          <SectionDesc>Метод распознавания речи при записи через хоткей</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 560 }}>
            {VOICE_PROVIDERS.map((p) => {
              const selected = localVoiceProvider === p.value;
              return (
                <Box
                  key={p.value}
                  onClick={() => setLocalVoiceProvider(p.value)}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    p: 1.75,
                    borderRadius: "10px",
                    border: `1.5px solid ${selected ? "#6366f1" : isDark ? "#2f2f2f" : "#e4e4e7"}`,
                    backgroundColor: selected
                      ? isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)"
                      : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": { borderColor: selected ? "#6366f1" : isDark ? "#444" : "#bbb" },
                  }}
                >
                  <Box
                    sx={{
                      mt: "2px",
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `2px solid ${selected ? "#6366f1" : isDark ? "#444" : "#ccc"}`,
                      backgroundColor: selected ? "#6366f1" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && (
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fff" }} />
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.9375rem", fontWeight: 600, color: isDark ? "#ececec" : "#0d0d0d", mb: 0.25 }}>
                      {p.label}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8125rem", color: isDark ? "#6e6e80" : "#8e8ea0" }}>
                      {p.desc}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {localVoiceProvider === "groq" && (
              <TextField
                fullWidth
                label="Groq API Ключ"
                type={showGroqKey ? "text" : "password"}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                helperText={
                  <span>
                    Получите бесплатно на{" "}
                    <a href="https://console.groq.com" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>
                      console.groq.com
                    </a>
                  </span>
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlinedIcon sx={{ fontSize: 16, color: isDark ? "#4a4a5a" : "#c5c5d2" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowGroqKey((s) => !s)}>
                        {showGroqKey
                          ? <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />
                          : <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            <Box>
              <Button variant="contained" onClick={handleSaveVoice}>
                Сохранить
              </Button>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            py: 3.5,
            pr: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
          }}
        >
          <SectionLabel>Управление</SectionLabel>
          <SectionTitle>Горячие клавиши</SectionTitle>
          <SectionDesc>Нажми на поле и удержи нужное сочетание</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 480 }}>
            <HotkeyCapture
              label="Показать / скрыть оверлей"
              value={localOverlayHotkey}
              onChange={setLocalOverlayHotkey}
              isDark={isDark}
            />
            <HotkeyCapture
              label="Запись голоса"
              value={localVoiceHotkey}
              onChange={setLocalVoiceHotkey}
              isDark={isDark}
            />
            <Box>
              <Button variant="contained" onClick={handleSaveHotkeys}>
                Применить
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 3.5, pr: { md: 4 }, borderBottom: `1px solid ${sectionBorder}` }}>
          <SectionLabel>Виджет</SectionLabel>
          <SectionTitle>Оверлей задач</SectionTitle>
          <SectionDesc>Позиция и уведомления о сервисах</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderBottom: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: isDark ? "#8e8ea0" : "#6e6e80",
                mb: 1.5,
              }}
            >
              Позиция на экране
            </Typography>
            <RadioGroup
              value={overlayPosition}
              onChange={(e) => handleOverlayPositionChange(e.target.value)}
              row
              sx={{ mb: 3, gap: 1 }}
            >
              {[
                { value: "top-left", label: "Верх · Лево" },
                { value: "top-right", label: "Верх · Право" },
                { value: "bottom-left", label: "Низ · Лево" },
                { value: "bottom-right", label: "Низ · Право" },
              ].map((o) => (
                <FormControlLabel
                  key={o.value}
                  value={o.value}
                  control={<Radio />}
                  label={
                    <Typography sx={{ fontSize: "0.9rem", color: isDark ? "#8e8ea0" : "#6e6e80" }}>
                      {o.label}
                    </Typography>
                  }
                />
              ))}
            </RadioGroup>

            <Divider sx={{ mb: 3 }} />

            <TextField
              label="Уведомлять о сервисах за (дней)"
              type="number"
              value={notifyDaysBefore}
              onChange={(e) => saveSetting("notify_days_before", e.target.value)}
              sx={{ maxWidth: 280 }}
            />
          </Box>
        </Box>

        <Box sx={{ py: 3.5, pr: { md: 4 } }}>
          <SectionLabel>Система</SectionLabel>
          <SectionTitle>Автозапуск</SectionTitle>
          <SectionDesc>Запускать Blueprint при входе в систему</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 480 }}>
            <Switch
              checked={autostartEnabled}
              onChange={(e) => handleAutostartToggle(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#0ea5e9" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#0ea5e9" },
              }}
            />
            <Box>
              <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500, color: isDark ? "#ececec" : "#0d0d0d" }}>
                {autostartEnabled ? "Включён" : "Отключён"}
              </Typography>
              <Typography sx={{ fontSize: "0.8125rem", color: isDark ? "#6e6e80" : "#8e8ea0" }}>
                Blueprint будет автоматически запускаться при старте системы
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ py: 3.5, pr: { md: 4 }, borderTop: `1px solid ${sectionBorder}` }}>
          <SectionLabel>Резервная копия</SectionLabel>
          <SectionTitle>Экспорт и импорт профиля</SectionTitle>
          <SectionDesc>Сохрани все данные и настройки в JSON или восстанови их из файла</SectionDesc>
        </Box>
        <Box
          sx={{
            py: 3.5,
            pl: { md: 4 },
            borderTop: `1px solid ${sectionBorder}`,
            borderLeft: { md: `1px solid ${sectionBorder}` },
          }}
        >
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleImportFileChange}
          />
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={handleExportProfile}>
              Экспортировать профиль
            </Button>
            <Button variant="contained" onClick={() => importInputRef.current?.click()}>
              Импортировать профиль
            </Button>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
