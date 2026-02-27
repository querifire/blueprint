import { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Tooltip,
  useTheme,
  Chip,
} from "@mui/material";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import MicOffRoundedIcon from "@mui/icons-material/MicOffRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useChatStore } from "../stores/chatStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const SUPPORTED_EXTENSIONS = [
  ".txt", ".md", ".json", ".csv", ".js", ".ts", ".tsx", ".jsx",
  ".py", ".html", ".css", ".yaml", ".yml", ".xml", ".log", ".ini", ".env",
];

function isTextFile(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file, "utf-8");
  });
}

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

const ACTION_LABELS: Record<string, string> = {
  add_client: "Клиент добавлен",
  add_service: "Сервис добавлен",
  add_note: "Заметка добавлена",
  complete_note: "Заметка выполнена",
  mark_payment: "Оплата обновлена",
};

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <Box sx={{ display: "flex", gap: "6px", alignItems: "center", py: 0.75 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            backgroundColor: isDark ? "#5e5e72" : "#c0c0cc",
            animation: "typing 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
            "@keyframes typing": {
              "0%, 60%, 100%": { opacity: 0.3, transform: "scale(1)" },
              "30%": { opacity: 1, transform: "scale(1.2)" },
            },
          }}
        />
      ))}
    </Box>
  );
}

const HINTS = [
  "Добавь клиента Иван, 5000₽ в месяц",
  "Добавь сервис: сервер проекта X, истекает 2025-12-01",
  "Создай заметку: позвонить Марии",
];

export default function Chat() {
  const { messages, loading, loadHistory, sendMessage, clearHistory, addMessage } = useChatStore();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const unlistenPromise = listen("voice-message-saved", () => {
      loadHistory();
    });
    return () => { unlistenPromise.then((fn) => fn()); };
  }, [loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || loading) return;

    let fullMessage = text;
    if (attachedFiles.length > 0) {
      const fileParts = attachedFiles.map((f) => {
        const kb = (f.size / 1024).toFixed(1);
        return `\n\n---\n📎 **${f.name}** (${kb} KB)\n\`\`\`\n${f.content}\n\`\`\``;
      });
      fullMessage = (text || "Проанализируй прикреплённые файлы") + fileParts.join("");
    }

    setInput("");
    setAttachedFiles([]);
    await sendMessage(fullMessage);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const results: AttachedFile[] = [];
    for (const file of files) {
      if (!isTextFile(file.name)) {
        addMessage({
          role: "assistant",
          content: `Файл "${file.name}" не поддерживается. Поддерживаются текстовые форматы: ${SUPPORTED_EXTENSIONS.join(", ")}`,
        });
        continue;
      }
      if (file.size > 500 * 1024) {
        addMessage({
          role: "assistant",
          content: `Файл "${file.name}" слишком большой (максимум 500 KB)`,
        });
        continue;
      }
      try {
        const content = await readFileAsText(file);
        results.push({ name: file.name, content, size: file.size });
      } catch {
        addMessage({ role: "assistant", content: `Не удалось прочитать "${file.name}"` });
      }
    }
    if (results.length > 0) {
      setAttachedFiles((prev) => [...prev, ...results]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoice = async () => {
    if (isRecording) {
      mediaRecorder?.stop();
      setIsRecording(false);
    } else {
      if (!navigator.mediaDevices?.getUserMedia) {
        addMessage({
          role: "assistant",
          content:
            "Микрофон недоступен в этом браузере. Попробуйте использовать голосовой хоткей из настроек.",
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const buffer = await blob.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          }
          const base64 = btoa(binary);
          try {
            const text = await invoke<string>("transcribe_audio", { audioBase64: base64 });
            if (text.trim()) await sendMessage(text.trim());
          } catch (e) {
            addMessage({ role: "assistant", content: `Ошибка транскрипции: ${e}` });
          }
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (e) {
        const errStr = String(e);
        let msg: string;
        if (errStr.includes("NotFound") || errStr.includes("DevicesNotFound")) {
          msg = "Микрофон не найден. Подключите микрофон и попробуйте снова.";
        } else if (errStr.includes("NotAllowed") || errStr.includes("Permission") || errStr.includes("PermissionDenied")) {
          msg = "Нет доступа к микрофону. Разрешите доступ: Параметры Windows → Конфиденциальность → Микрофон.";
        } else if (errStr.includes("NotReadable") || errStr.includes("TrackStart")) {
          msg = "Микрофон занят другим приложением. Закройте его и попробуйте снова.";
        } else {
          msg = `Ошибка микрофона: ${errStr}`;
        }
        addMessage({ role: "assistant", content: msg });
      }
    }
  };

  const borderColor = isDark ? "#2f2f2f" : "#e8e8e8";
  const userMsgBg = isDark ? "#363636" : "#f0f0f0";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: { xs: "100%", sm: 760, md: 860, lg: 960 },
        mx: "auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, md: 4 },
          py: 1.75,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: isDark ? "#ececec" : "#0d0d0d",
          }}
        >
          Blueprint AI
        </Typography>
        <Tooltip title="Очистить историю" arrow>
          <IconButton size="small" onClick={clearHistory}>
            <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: { xs: 2.5, md: 4 }, py: 3 }}>
        {messages.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 3.5,
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: isDark ? "#ececec" : "#0d0d0d",
                  mb: 1,
                  fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                Чем помочь?
              </Typography>
              <Typography
                sx={{
                  color: isDark ? "#6e6e80" : "#acacbe",
                  fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                }}
              >
                Управляй клиентами, сервисами и задачами
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
              {HINTS.map((hint) => (
                <Box
                  key={hint}
                  onClick={() => setInput(hint)}
                  sx={{
                    px: 2,
                    py: 1,
                    border: `1px solid ${borderColor}`,
                    borderRadius: "9px",
                    cursor: "pointer",
                    fontSize: "clamp(0.8125rem, 1.2vw, 0.9375rem)",
                    color: isDark ? "#8e8ea0" : "#6e6e80",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: isDark ? "#555" : "#aaa",
                      color: isDark ? "#ececec" : "#0d0d0d",
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    },
                  }}
                >
                  {hint}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                mb: 2.5,
              }}
            >
              {isUser ? (
                <Box
                  sx={{
                    maxWidth: "75%",
                    px: 2.5,
                    py: 1.5,
                    backgroundColor: userMsgBg,
                    borderRadius: "14px 14px 4px 14px",
                    fontSize: "clamp(0.875rem, 1.3vw, 1rem)",
                    lineHeight: 1.65,
                    color: isDark ? "#ececec" : "#0d0d0d",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </Box>
              ) : (
                <Box sx={{ maxWidth: "90%", display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box
                    sx={{
                      fontSize: "clamp(0.875rem, 1.3vw, 1rem)",
                      lineHeight: 1.75,
                      color: isDark ? "#ececec" : "#0d0d0d",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </Box>
                  {msg.actions && msg.actions.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignSelf: "flex-start" }}>
                      {Object.entries(
                        msg.actions.reduce<Record<string, number>>((acc, a) => {
                          const key = ACTION_LABELS[(a.action as string)] ?? "Выполнено";
                          acc[key] = (acc[key] ?? 0) + 1;
                          return acc;
                        }, {})
                      ).map(([label, count]) => (
                        <Box
                          key={label}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                            px: 1.25,
                            py: 0.4,
                            borderRadius: "5px",
                            backgroundColor: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.08)",
                            border: `1px solid ${isDark ? "rgba(14,165,233,0.25)" : "rgba(14,165,233,0.2)"}`,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: "#0ea5e9",
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: "0.8125rem",
                              color: isDark ? "#38bdf8" : "#0284c7",
                              fontWeight: 600,
                            }}
                          >
                            {count > 1 ? `${label} ×${count}` : label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          );
        })}

        {loading && (
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <TypingIndicator isDark={isDark} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 4 }, pb: { xs: 2.5, md: 3.5 }, pt: 1.5 }}>
        {isRecording && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, px: 0.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                animation: "pulse 1.2s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.3 },
                },
              }}
            />
            <Typography sx={{ fontSize: "0.8125rem", color: isDark ? "#f87171" : "#dc2626" }}>
              Запись...
            </Typography>
          </Box>
        )}

        {attachedFiles.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1, px: 0.5 }}>
            {attachedFiles.map((f) => (
              <Chip
                key={f.name}
                label={f.name}
                size="small"
                onDelete={() => setAttachedFiles((prev) => prev.filter((af) => af.name !== f.name))}
                deleteIcon={<CloseRoundedIcon />}
                sx={{
                  fontSize: "0.75rem",
                  backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.07)",
                  color: isDark ? "#a5b4fc" : "#4f46e5",
                  border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.2)"}`,
                  "& .MuiChip-deleteIcon": {
                    fontSize: 14,
                    color: isDark ? "#a5b4fc" : "#4f46e5",
                  },
                }}
              />
            ))}
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_EXTENSIONS.join(",")}
          style={{ display: "none" }}
          onChange={handleFileAttach}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 0.75,
            border: `1px solid ${isRecording ? "#ef4444" : borderColor}`,
            borderRadius: "14px",
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            p: "10px 10px 10px 18px",
            transition: "border-color 0.15s ease",
            "&:focus-within": {
              borderColor: isRecording ? "#ef4444" : isDark ? "#555" : "#aaa",
            },
          }}
        >
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={8}
            placeholder="Сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              flex: 1,
              "& .MuiInputBase-root": { fontFamily: "'Manrope', sans-serif" },
              "& .MuiInputBase-input": {
                fontSize: "clamp(0.9375rem, 1.3vw, 1.0625rem)",
                lineHeight: 1.6,
                color: isDark ? "#ececec" : "#0d0d0d",
                fontFamily: "'Manrope', sans-serif",
                "&::placeholder": {
                  color: isDark ? "#424258" : "#c0c0cc",
                  opacity: 1,
                },
              },
            }}
          />
          <Tooltip title="Прикрепить файл" arrow>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                color: attachedFiles.length > 0 ? "#6366f1" : isDark ? "#5e5e72" : "#a0a0b0",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: isDark ? "#ececec" : "#0d0d0d",
                },
              }}
            >
              <AttachFileRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={isRecording ? "Остановить" : "Голосовой ввод"} arrow>
            <IconButton
              size="small"
              onClick={toggleVoice}
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                color: isRecording ? "#ef4444" : isDark ? "#5e5e72" : "#a0a0b0",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: isRecording ? "#dc2626" : isDark ? "#ececec" : "#0d0d0d",
                },
              }}
            >
              {isRecording
                ? <MicOffRoundedIcon sx={{ fontSize: 18 }} />
                : <MicRoundedIcon sx={{ fontSize: 18 }} />
              }
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={handleSend}
            disabled={((!input.trim() && attachedFiles.length === 0) || loading)}
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: "9px",
              backgroundColor: (input.trim() || attachedFiles.length > 0) && !loading
                ? isDark ? "#ffffff" : "#0d0d0d"
                : isDark ? "#333" : "#f0f0f0",
              color: (input.trim() || attachedFiles.length > 0) && !loading
                ? isDark ? "#000000" : "#ffffff"
                : isDark ? "#444" : "#c5c5d2",
              transition: "all 0.15s ease",
              "&:hover": {
                backgroundColor: (input.trim() || attachedFiles.length > 0) && !loading
                  ? isDark ? "#e8e8e8" : "#2d2d2d"
                  : isDark ? "#333" : "#f0f0f0",
              },
              "&.Mui-disabled": {
                backgroundColor: isDark ? "#333" : "#f0f0f0",
                color: isDark ? "#444" : "#c5c5d2",
              },
            }}
          >
            <ArrowUpwardRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
