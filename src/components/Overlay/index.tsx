import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  ThemeProvider,
  CssBaseline,
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { lightTheme, darkTheme } from "../../theme";

interface Note {
  id: string;
  title: string;
  content?: string;
  completed: boolean;
}

interface Service {
  id: string;
  project_name: string;
  service_name: string;
  expires_at: string;
  cost?: number;
  currency: string;
}

function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(days: number): "ok" | "warning" | "critical" | "expired" {
  if (days < 0) return "expired";
  if (days <= 3) return "critical";
  if (days <= 14) return "warning";
  return "ok";
}

export default function Overlay() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [urgentServices, setUrgentServices] = useState<Service[]>([]);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const loadNotes = async () => {
    try {
      const data = await invoke<Note[]>("get_incomplete_notes");
      setNotes(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadServices = async () => {
    try {
      const data = await invoke<Service[]>("get_services");
      const urgent = data.filter((s) => {
        const status = getExpiryStatus(getDaysRemaining(s.expires_at));
        return status === "critical" || status === "expired" || status === "warning";
      });
      setUrgentServices(urgent);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadNotes();
    loadServices();
    const interval = setInterval(() => {
      loadNotes();
      loadServices();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (id: string) => {
    await invoke("toggle_note", { id, completed: true });
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClose = () => getCurrentWindow().hide();

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "transparent" }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: isDark ? "rgba(17,17,19,0.94)" : "rgba(250,250,250,0.94)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1.25,
              borderBottom: `1px solid ${isDark ? "#1e1e21" : "#e4e4e7"}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ flex: 1, fontWeight: 600, letterSpacing: "0.06em", color: isDark ? "#52525b" : "#a1a1aa", textTransform: "uppercase", fontSize: "0.875rem" }}
            >
              Задачи
              {notes.length > 0 && (
                <Box component="span" sx={{ ml: 1, fontWeight: 400, color: isDark ? "#3f3f46" : "#d4d4d8" }}>
                  {notes.length}
                </Box>
              )}
            </Typography>
            <IconButton size="small" onClick={handleClose} sx={{ width: 30, height: 30, color: isDark ? "#52525b" : "#a1a1aa" }}>
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          {urgentServices.length > 0 && (
            <>
              <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: isDark ? "#ef4444" : "#dc2626" }}>
                  Срочно · {urgentServices.length}
                </Typography>
              </Box>
              <List disablePadding sx={{ mb: 0.5 }}>
                {urgentServices.map((svc) => {
                  const days = getDaysRemaining(svc.expires_at);
                  const status = getExpiryStatus(days);
                  const isCritical = status === "critical" || status === "expired";
                  return (
                    <Box key={svc.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        py: 0.75,
                        gap: 1,
                        backgroundColor: isCritical
                          ? isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)"
                          : isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
                      }}
                    >
                      {isCritical
                        ? <ErrorOutlineRoundedIcon sx={{ fontSize: 14, color: isDark ? "#ef4444" : "#dc2626", flexShrink: 0 }} />
                        : <WarningAmberRoundedIcon sx={{ fontSize: 14, color: isDark ? "#f59e0b" : "#b45309", flexShrink: 0 }} />
                      }
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.9375rem", color: isDark ? "#d4d4d8" : "#27272a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {svc.service_name}
                        </Typography>
                        <Typography sx={{ fontSize: "0.8125rem", color: isDark ? "#3f3f46" : "#d4d4d8" }}>
                          {svc.project_name}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: isCritical ? isDark ? "#ef4444" : "#dc2626" : isDark ? "#f59e0b" : "#b45309", flexShrink: 0 }}>
                        {days < 0 ? "Истёк" : `${days} дн`}
                      </Typography>
                    </Box>
                  );
                })}
              </List>
              <Divider sx={{ borderColor: isDark ? "#1e1e21" : "#f4f4f5" }} />
            </>
          )}

          <Box sx={{ flex: 1, overflow: "auto" }}>
            {notes.length === 0 && urgentServices.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 1,
                  py: 4,
                }}
              >
                <CheckCircleOutlineRoundedIcon sx={{ fontSize: 28, color: isDark ? "#27272a" : "#e4e4e7" }} />
                <Typography variant="caption" sx={{ color: isDark ? "#3f3f46" : "#d4d4d8" }}>
                  Всё выполнено
                </Typography>
              </Box>
            )}
            <List disablePadding>
              {notes.map((note, idx) => (
                <Box key={note.id}>
                  {idx > 0 && <Divider sx={{ borderColor: isDark ? "#1e1e21" : "#f4f4f5" }} />}
                  <ListItemButton
                    dense
                    disableRipple
                    onClick={() => handleToggle(note.id)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 0,
                      gap: 1.25,
                      "&:hover": { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <CircleOutlinedIcon sx={{ fontSize: 18, flexShrink: 0, color: isDark ? "#27272a" : "#e4e4e7" }} />
                    <ListItemText
                      primary={note.title}
                      secondary={note.content}
                      primaryTypographyProps={{
                        fontSize: "0.9375rem",
                        letterSpacing: "-0.01em",
                        color: isDark ? "#d4d4d8" : "#27272a",
                      }}
                      secondaryTypographyProps={{ fontSize: "0.8125rem", color: isDark ? "#3f3f46" : "#d4d4d8" }}
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
          </Box>

          <Box
            sx={{
              px: 2,
              py: 0.75,
              borderTop: `1px solid ${isDark ? "#1e1e21" : "#f4f4f5"}`,
            }}
          >
            <Typography variant="caption" sx={{ color: isDark ? "#27272a" : "#e4e4e7", fontSize: "0.8125rem" }}>
              Нажми хоткей чтобы скрыть
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
