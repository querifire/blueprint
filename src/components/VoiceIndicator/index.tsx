import { useEffect, useRef, useState } from "react";
import { Box, Typography, ThemeProvider, GlobalStyles, IconButton } from "@mui/material";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { lightTheme, darkTheme } from "../../theme";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

type Status = "recording" | "processing" | "error";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

async function notify(body: string) {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === "granted";
  }
  if (granted) sendNotification({ title: "Blueprint", body });
}

async function executeAction(action: Record<string, unknown>) {
  const type = action.action as string;
  const data = action.data as Record<string, unknown>;
  try {
    switch (type) {
      case "add_client":
        await invoke("create_client", { input: data });
        break;
      case "add_service":
        await invoke("create_service", { input: data });
        break;
      case "add_note": {
        let categoryId: string | undefined;
        if (data.category) {
          const cats = await invoke<{ id: string; name: string }[]>("get_categories");
          const found = cats.find(
            (c) => c.name.toLowerCase() === (data.category as string).toLowerCase()
          );
          if (found) {
            categoryId = found.id;
          } else {
            const newCat = await invoke<{ id: string }>("create_category", {
              input: { name: data.category, color: "#1a73e8" },
            });
            categoryId = newCat.id;
          }
        }
        await invoke("create_note", {
          input: { title: data.title, content: data.content, category_id: categoryId },
        });
        break;
      }
      case "complete_note": {
        const notes = await invoke<{ id: string; title: string }[]>("get_notes", {
          categoryId: null,
        });
        const query = ((data.title_query as string) || "").toLowerCase();
        const found = notes.find((n) => n.title.toLowerCase().includes(query));
        if (found) await invoke("toggle_note", { id: found.id, completed: true });
        break;
      }
      case "mark_payment":
        await invoke("toggle_payment", {
          clientId: (data as Record<string, unknown>).client_id,
          period: data.period,
          paid: data.paid,
        });
        break;
    }
  } catch (e) {
    console.error("Action failed:", e);
  }
}

export default function VoiceIndicator() {
  const [isDark, setIsDark] = useState(false);
  const [status, setStatus] = useState<Status>("recording");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const providerRef = useRef<string>("openai");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    invoke<Record<string, string>>("get_settings").then((settings) => {
      const provider = settings.voice_provider || "openai";
      providerRef.current = provider === "browser" ? "openai" : provider;
      startMediaRecording();
    });

    listen("stop-recording", () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      } else {
        invoke("hide_voice_indicator").catch(() =>
          getCurrentWindow().close().catch(() => {})
        );
      }
    }).then((fn) => { unlistenFn = fn; });

    return () => {
      if (unlistenFn) unlistenFn();
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, []);

  const processText = async (text: string) => {
    if (!text.trim()) return;
    const history = await invoke<{ role: string; content: string }[]>("get_chat_history", { limit: 9 });
    await invoke("save_chat_message", { role: "user", content: text.trim() });
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text.trim() },
    ];
    const response = await invoke<{ content: string; actions: Array<Record<string, unknown>> }>("chat_with_ai", {
      input: { messages },
    });
    await invoke("save_chat_message", { role: "assistant", content: response.content });
    if (response.actions?.length) {
      for (const action of response.actions) {
        await executeAction(action);
      }
    }
    await notify(response.content);
  };

  const startMediaRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      await notify("Нет доступа к микрофону. Проверьте настройки конфиденциальности Windows.");
      setTimeout(() => invoke("hide_voice_indicator").catch(() => getCurrentWindow().close().catch(() => {})), 3000);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStatus("processing");
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const buffer = await blob.arrayBuffer();
          const base64 = arrayBufferToBase64(buffer);
          const text = await invoke<string>("transcribe_audio", { audioBase64: base64 });
          await processText(text);
          await invoke("emit_voice_message_saved");
        } catch (e) {
          await notify(`Ошибка: ${e}`);
        } finally {
          await invoke("hide_voice_indicator").catch(() =>
            getCurrentWindow().close().catch(() => {})
          );
        }
      };

      recorder.start();
      recorderRef.current = recorder;
    } catch (e) {
      setStatus("error");
      const errStr = String(e);
      let msg: string;
      if (errStr.includes("NotFound") || errStr.includes("DevicesNotFound")) {
        msg = "Микрофон не найден. Подключите микрофон и попробуйте снова.";
      } else if (errStr.includes("NotAllowed") || errStr.includes("Permission") || errStr.includes("PermissionDenied")) {
        msg = "Нет доступа к микрофону. Разрешите доступ: Параметры → Конфиденциальность → Микрофон.";
      } else if (errStr.includes("NotReadable") || errStr.includes("TrackStart")) {
        msg = "Микрофон занят другим приложением. Закройте его и попробуйте снова.";
      } else {
        msg = `Ошибка микрофона: ${errStr}`;
      }
      await notify(msg);
      setTimeout(() => invoke("hide_voice_indicator").catch(() => getCurrentWindow().close().catch(() => {})), 3000);
    }
  };

  const handleClose = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    invoke("hide_voice_indicator").catch(() =>
      getCurrentWindow().close().catch(() => {})
    );
  };

  const isProcessing = status === "processing";
  const isError = status === "error";

  const accentColor = isError
    ? isDark ? "#fcd34d" : "#b45309"
    : isDark ? "#fca5a5" : "#dc2626";

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyles styles={{ "html, body, #root": { background: "transparent !important", margin: 0, padding: 0 } }} />
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            pl: 1.5,
            pr: 0.5,
            py: 0.5,
            borderRadius: "100px",
            backgroundColor: isDark ? "rgba(17,17,19,0.92)" : "rgba(250,250,250,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: `1px solid ${isError ? "rgba(245,158,11,0.3)" : "rgba(252,165,165,0.3)"}`,
            boxShadow: `0 4px 16px ${isError ? "rgba(245,158,11,0.2)" : "rgba(220,38,38,0.2)"}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: isError ? "rgba(245,158,11,0.12)" : "rgba(220,38,38,0.12)",
              position: "relative",
              "&::before": isProcessing || isError
                ? undefined
                : {
                    content: '""',
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(220,38,38,0.3)",
                    animation: "ripple 1.5s ease-in-out infinite",
                  },
              "@keyframes ripple": {
                "0%": { opacity: 1, transform: "scale(1)" },
                "100%": { opacity: 0, transform: "scale(1.6)" },
              },
            }}
          >
            <MicRoundedIcon sx={{ fontSize: 13, color: accentColor }} />
          </Box>

          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              letterSpacing: "-0.01em",
              color: accentColor,
            }}
          >
            {isError ? "Ошибка" : isProcessing ? "Обработка..." : "Запись"}
          </Typography>

          {!isProcessing && !isError && (
            <Box sx={{ display: "flex", gap: "3px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 3,
                    borderRadius: 2,
                    backgroundColor: isDark ? "#fca5a5" : "#dc2626",
                    animation: "wave 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                    "@keyframes wave": {
                      "0%, 100%": { height: 8 },
                      "50%": { height: 14 },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {isProcessing && (
            <Box sx={{ display: "flex", gap: "3px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 3,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: isDark ? "#fca5a5" : "#dc2626",
                    opacity: 0.4,
                    animation: "pulse 1s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes pulse": {
                      "0%, 100%": { opacity: 0.4 },
                      "50%": { opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              width: 20,
              height: 20,
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
              "&:hover": { color: accentColor, backgroundColor: "transparent" },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
