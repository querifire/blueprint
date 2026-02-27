import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Box, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let counter = 0;

const ICONS = {
  success: <CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />,
  error: <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} />,
  info: <InfoOutlinedIcon sx={{ fontSize: 16 }} />,
  warning: <WarningAmberRoundedIcon sx={{ fontSize: 16 }} />,
};

const COLORS = {
  success: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)", icon: "#4ade80", text: "#86efac" },
  error: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", icon: "#f87171", text: "#fca5a5" },
  info: { bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.25)", icon: "#38bdf8", text: "#7dd3fc" },
  warning: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", icon: "#fbbf24", text: "#fde68a" },
};

const LIGHT_COLORS = {
  success: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", icon: "#16a34a", text: "#15803d" },
  error: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: "#dc2626", text: "#b91c1c" },
  info: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.2)", icon: "#0284c7", text: "#0369a1" },
  warning: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: "#b45309", text: "#92400e" },
};

function ToastItem({ toast, onRemove, isDark }: { toast: Toast; onRemove: (id: number) => void; isDark: boolean }) {
  const colors = isDark ? COLORS[toast.type] : LIGHT_COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ cursor: "pointer" }}
      onClick={() => onRemove(toast.id)}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.2,
          px: 1.8,
          py: 1.3,
          borderRadius: "9px",
          background: isDark ? "rgba(23,23,23,0.92)" : "rgba(255,255,255,0.95)",
          border: `1px solid ${colors.border}`,
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0,0,0,0.45)"
            : "0 8px 24px rgba(0,0,0,0.1)",
          minWidth: 220,
          maxWidth: 340,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ color: colors.icon, display: "flex", flexShrink: 0 }}>
          {ICONS[toast.type]}
        </Box>
        <Box
          sx={{
            fontSize: "0.8375rem",
            fontWeight: 500,
            fontFamily: "'Manrope', sans-serif",
            color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.8)",
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </Box>
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            background: colors.icon,
            borderRadius: "0 0 0 9px",
          }}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 3.2, ease: "linear" }}
        />
      </Box>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} isDark={isDark} />
          ))}
        </AnimatePresence>
      </Box>
    </ToastContext.Provider>
  );
}
