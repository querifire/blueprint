import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, InputBase, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import { invoke } from "@tauri-apps/api/core";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const commands: CommandItem[] = [
    {
      id: "chat",
      label: "Чат с AI",
      description: "Открыть чат с ассистентом",
      icon: <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 17 }} />,
      action: () => go("/"),
      keywords: "чат ai ассистент",
    },
    {
      id: "clients",
      label: "Клиенты",
      description: "Управление клиентами",
      icon: <PeopleOutlinedIcon sx={{ fontSize: 17 }} />,
      action: () => go("/clients"),
      keywords: "клиенты люди контакты",
    },
    {
      id: "services",
      label: "Сервисы",
      description: "Управление сервисами",
      icon: <DnsOutlinedIcon sx={{ fontSize: 17 }} />,
      action: () => go("/services"),
      keywords: "сервисы услуги",
    },
    {
      id: "notes",
      label: "Заметки",
      description: "Просмотр и редактирование заметок",
      icon: <AssignmentOutlinedIcon sx={{ fontSize: 17 }} />,
      action: () => go("/notes"),
      keywords: "заметки задачи",
    },
    {
      id: "settings",
      label: "Настройки",
      description: "Параметры приложения",
      icon: <SettingsOutlinedIcon sx={{ fontSize: 17 }} />,
      action: () => go("/settings"),
      keywords: "настройки параметры конфигурация",
    },
    {
      id: "overlay",
      label: "Оверлей",
      description: "Открыть оверлейное окно",
      icon: <LayersOutlinedIcon sx={{ fontSize: 17 }} />,
      action: () => { invoke("toggle_overlay_window"); onClose(); },
      keywords: "оверлей overlay",
    },
  ];

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.label.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.keywords?.toLowerCase().includes(q)
        );
      })
    : commands;

  useEffect(() => {
    setSelected(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selected]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const bg = isDark ? "#1a1a1a" : "#ffffff";
  const borderColor = isDark ? "#2f2f2f" : "#e5e5e5";
  const inputColor = isDark ? "#ececec" : "#0d0d0d";
  const placeholderColor = isDark ? "#6e6e80" : "#a0a0b0";
  const itemHoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const itemSelectedBg = isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.08)";
  const labelColor = isDark ? "#ececec" : "#0d0d0d";
  const descColor = isDark ? "#8e8ea0" : "#6e6e80";
  const iconColor = isDark ? "#8e8ea0" : "#6e6e80";
  const iconSelectedColor = "#0ea5e9";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
            }}
          />

          <motion.div
            key="palette"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed",
              top: "20%",
              left: "50%",
              translateX: "-50%",
              zIndex: 10001,
              width: 520,
              maxWidth: "calc(100vw - 48px)",
            }}
          >
            <Box
              sx={{
                background: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: isDark
                  ? "0 32px 80px rgba(0,0,0,0.7)"
                  : "0 32px 80px rgba(0,0,0,0.15)",
              }}
              onKeyDown={handleKeyDown}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  height: 52,
                  borderBottom: `1px solid ${borderColor}`,
                  gap: 1.5,
                }}
              >
                <Box sx={{ color: placeholderColor, display: "flex", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </Box>
                <InputBase
                  inputRef={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по разделам..."
                  fullWidth
                  sx={{
                    fontSize: "0.9375rem",
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 500,
                    color: inputColor,
                    "& input::placeholder": { color: placeholderColor, opacity: 1 },
                  }}
                />
                <Box
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: placeholderColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: "5px",
                    px: 0.8,
                    py: 0.3,
                    flexShrink: 0,
                    fontFamily: "monospace",
                  }}
                >
                  ESC
                </Box>
              </Box>

              <Box sx={{ py: 0.5, maxHeight: 320, overflowY: "auto" }}>
                {filtered.length === 0 ? (
                  <Box
                    sx={{
                      py: 3,
                      textAlign: "center",
                      fontSize: "0.875rem",
                      color: placeholderColor,
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Ничего не найдено
                  </Box>
                ) : (
                  filtered.map((item, idx) => {
                    const isSelected = idx === selected;
                    return (
                      <Box
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelected(idx)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          px: 2,
                          py: 1.2,
                          mx: 0.5,
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: isSelected ? itemSelectedBg : "transparent",
                          transition: "background-color 0.1s ease",
                          "&:hover": { backgroundColor: isSelected ? itemSelectedBg : itemHoverBg },
                        }}
                      >
                        <Box
                          sx={{
                            color: isSelected ? iconSelectedColor : iconColor,
                            display: "flex",
                            flexShrink: 0,
                            transition: "color 0.1s ease",
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: isSelected ? (isDark ? "#ececec" : "#0d0d0d") : labelColor,
                              fontFamily: "'Manrope', sans-serif",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.label}
                          </Box>
                          {item.description && (
                            <Box
                              sx={{
                                fontSize: "0.775rem",
                                color: descColor,
                                fontFamily: "'Manrope', sans-serif",
                                mt: 0.2,
                              }}
                            >
                              {item.description}
                            </Box>
                          )}
                        </Box>
                        {isSelected && (
                          <Box sx={{ color: "#0ea5e9", display: "flex", flexShrink: 0 }}>
                            <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />
                          </Box>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>

              <Box
                sx={{
                  borderTop: `1px solid ${borderColor}`,
                  px: 2,
                  py: 1,
                  display: "flex",
                  gap: 2,
                }}
              >
                {[
                  { keys: ["↑", "↓"], label: "навигация" },
                  { keys: ["Enter"], label: "выбрать" },
                  { keys: ["Ctrl", "K"], label: "закрыть" },
                ].map((hint) => (
                  <Box key={hint.label} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    {hint.keys.map((k) => (
                      <Box
                        key={k}
                        component="kbd"
                        sx={{
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          color: placeholderColor,
                          border: `1px solid ${borderColor}`,
                          borderRadius: "4px",
                          px: 0.7,
                          py: 0.2,
                          fontFamily: "monospace",
                          lineHeight: 1.6,
                        }}
                      >
                        {k}
                      </Box>
                    ))}
                    <Box sx={{ fontSize: "0.7rem", color: placeholderColor, fontFamily: "'Manrope', sans-serif" }}>
                      {hint.label}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
