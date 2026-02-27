import { createTheme, Components, Theme } from "@mui/material/styles";

function getComponents(mode: "light" | "dark"): Components<Theme> {
  const d = mode === "dark";
  return {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
          "&::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 3,
            background: d ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)",
            "&:hover": { background: d ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.2)" },
          },
          "input[type=number]": {
            MozAppearance: "textfield",
            "&::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
            "&::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
          },
        },
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          fontFamily: "'Manrope', sans-serif",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 7,
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
          letterSpacing: "0em",
          padding: "8px 18px",
          lineHeight: "1.4",
          transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
          fontFamily: "'Manrope', sans-serif",
        },
        contained: {
          backgroundColor: d ? "#ffffff" : "#0d0d0d",
          color: d ? "#000000" : "#ffffff",
          "&:hover": { backgroundColor: d ? "#e8e8e8" : "#2d2d2d" },
          "&.Mui-disabled": {
            backgroundColor: d ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
            color: d ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
          },
        },
        outlined: {
          borderColor: d ? "#404040" : "#d0d0d0",
          color: d ? "#ececec" : "#0d0d0d",
          "&:hover": {
            borderColor: d ? "#666" : "#999",
            backgroundColor: d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          },
        },
        text: {
          color: d ? "#8e8ea0" : "#6e6e80",
          "&:hover": {
            backgroundColor: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            color: d ? "#ececec" : "#0d0d0d",
          },
        },
        sizeSmall: { padding: "8px 16px", fontSize: "0.825rem" },
      },
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 7,
          color: d ? "#8e8ea0" : "#6e6e80",
          transition: "background-color 0.15s ease, color 0.15s ease",
          "&:hover": {
            backgroundColor: d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
            color: d ? "#ececec" : "#0d0d0d",
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: `1px solid ${d ? "#2f2f2f" : "#e5e5e5"}`,
          backgroundColor: d ? "#2a2a2a" : "#ffffff",
          backgroundImage: "none",
          transition: "border-color 0.15s ease",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundImage: "none",
          backgroundColor: d ? "#2a2a2a" : "#ffffff",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 5,
          fontWeight: 600,
          fontSize: "0.8rem",
          height: 26,
          transition: "all 0.15s ease",
          fontFamily: "'Manrope', sans-serif",
        },
        outlined: {
          borderColor: d ? "#404040" : "#d9d9d9",
          color: d ? "#8e8ea0" : "#6e6e80",
        },
        filled: {
          backgroundColor: d ? "#3a3a3a" : "#f0f0f0",
          color: d ? "#c5c5d2" : "#4a4a5a",
        },
        colorPrimary: {
          backgroundColor: d ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.1)",
          color: d ? "#38bdf8" : "#0284c7",
          borderColor: d ? "rgba(14,165,233,0.3)" : "rgba(14,165,233,0.25)",
        },
        colorSuccess: {
          backgroundColor: d ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.08)",
          color: d ? "#4ade80" : "#16a34a",
          border: `1px solid ${d ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.2)"}`,
        },
        colorWarning: {
          backgroundColor: d ? "rgba(245,158,11,0.1)" : "rgba(245,158,11,0.08)",
          color: d ? "#fbbf24" : "#b45309",
          border: `1px solid ${d ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.2)"}`,
        },
        colorError: {
          backgroundColor: d ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.08)",
          color: d ? "#f87171" : "#dc2626",
          border: `1px solid ${d ? "rgba(239,68,68,0.25)" : "rgba(239,68,68,0.2)"}`,
        },
      },
    },
    MuiListItemButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          borderRadius: 7,
          margin: "1px 4px",
          padding: "9px 12px",
          transition: "background-color 0.12s ease",
          "&:hover": {
            backgroundColor: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          },
          "&.Mui-selected": {
            backgroundColor: d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
            "&:hover": {
              backgroundColor: d ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)",
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${d ? "#333" : "#e5e5e5"}`,
          backgroundColor: d ? "#212121" : "#ffffff",
          backgroundImage: "none",
          padding: 0,
          boxShadow: d
            ? "0 24px 64px rgba(0,0,0,0.65)"
            : "0 24px 64px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
          fontWeight: 700,
          padding: "22px 28px 0",
          color: d ? "#ececec" : "#0d0d0d",
          fontFamily: "'Manrope', sans-serif",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: "18px 28px" },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "14px 28px 22px",
          gap: 10,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "none",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "medium" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 7,
            fontSize: "0.9375rem",
            fontFamily: "'Manrope', sans-serif",
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: d ? "#3a3a3a" : "#d5d5d5",
              transition: "border-color 0.15s ease",
            },
            "&:hover fieldset": { borderColor: d ? "#666" : "#aaa" },
            "&.Mui-focused fieldset": {
              borderColor: "#0ea5e9",
              borderWidth: 1,
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.9375rem",
            fontFamily: "'Manrope', sans-serif",
            "&.Mui-focused": { color: "#0ea5e9" },
          },
          "& .MuiFormHelperText-root": {
            fontSize: "0.8125rem",
            fontFamily: "'Manrope', sans-serif",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 7,
          fontSize: "0.9375rem",
          fontFamily: "'Manrope', sans-serif",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          "& fieldset": { borderColor: d ? "#3a3a3a" : "#d5d5d5" },
          "&:hover fieldset": { borderColor: d ? "#666" : "#aaa" },
          "&.Mui-focused fieldset": {
            borderColor: "#0ea5e9",
            borderWidth: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontFamily: "'Manrope', sans-serif",
          fontSize: "0.9375rem",
          "&.Mui-focused": { color: "#0ea5e9" },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.9375rem",
          fontFamily: "'Manrope', sans-serif",
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: d ? "#2f2f2f" : "#f0f0f0",
          borderRadius: 8,
          padding: 3,
          border: "none",
        },
        grouped: {
          borderRadius: "6px !important",
          border: "none !important",
          margin: "0 1px !important",
        },
      },
    },
    MuiToggleButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.875rem",
          padding: "7px 18px",
          color: d ? "#8e8ea0" : "#6e6e80",
          fontFamily: "'Manrope', sans-serif",
          transition: "all 0.15s ease",
          "&.Mui-selected": {
            backgroundColor: d ? "#424242" : "#ffffff",
            color: d ? "#ececec" : "#0d0d0d",
            boxShadow: d
              ? "0 1px 4px rgba(0,0,0,0.5)"
              : "0 1px 4px rgba(0,0,0,0.1)",
            "&:hover": { backgroundColor: d ? "#424242" : "#ffffff" },
          },
          "&:hover": {
            backgroundColor: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { enterDelay: 300, enterNextDelay: 200 },
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: "0.8125rem",
          fontWeight: 600,
          fontFamily: "'Manrope', sans-serif",
          backgroundColor: d ? "#424242" : "#1a1a1a",
          color: "#ffffff",
          padding: "5px 10px",
        },
        arrow: { color: d ? "#424242" : "#1a1a1a" },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: d ? "#2f2f2f" : "#e8e8e8" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          fontSize: "0.875rem",
          fontFamily: "'Manrope', sans-serif",
          border: "1px solid",
        },
        standardInfo: {
          backgroundColor: d ? "rgba(14,165,233,0.08)" : "rgba(14,165,233,0.05)",
          borderColor: d ? "rgba(14,165,233,0.2)" : "rgba(14,165,233,0.15)",
          color: d ? "#38bdf8" : "#0284c7",
          "& .MuiAlert-icon": { color: d ? "#38bdf8" : "#0284c7" },
        },
        standardSuccess: {
          backgroundColor: d ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.05)",
          borderColor: d ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)",
          color: d ? "#4ade80" : "#16a34a",
          "& .MuiAlert-icon": { color: d ? "#4ade80" : "#16a34a" },
        },
        standardError: {
          backgroundColor: d ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)",
          borderColor: d ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
          color: d ? "#f87171" : "#dc2626",
          "& .MuiAlert-icon": { color: d ? "#f87171" : "#dc2626" },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundColor: d ? "#2f2f2f" : "#e8e8e8",
          height: 2,
        },
      },
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: d ? "#3a3a3a" : "#d0d0d0",
          transition: "color 0.15s ease",
          "&.Mui-checked": { color: "#0ea5e9" },
        },
      },
    },
    MuiRadio: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          color: d ? "#3a3a3a" : "#d0d0d0",
          "&.Mui-checked": { color: "#0ea5e9" },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: "#0ea5e9" },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: { fontFamily: "'Manrope', sans-serif" },
      },
    },
  };
}

const typography = {
  fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  htmlFontSize: 16,
  fontSize: 15,
  h4: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.75rem" },
  h5: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.375rem" },
  h6: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "1.125rem" },
  subtitle1: { fontWeight: 600, fontSize: "1rem" },
  subtitle2: { fontWeight: 700, fontSize: "0.9375rem" },
  body1: { fontSize: "0.9375rem", lineHeight: 1.65 },
  body2: { fontSize: "0.875rem", lineHeight: 1.6 },
  button: { fontWeight: 600, textTransform: "none" as const },
  caption: { fontSize: "0.875rem", lineHeight: 1.4 },
  overline: { letterSpacing: "0.06em", fontWeight: 700, fontSize: "0.75rem" },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0ea5e9",
      light: "#38bdf8",
      dark: "#0284c7",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#6e6e80",
      light: "#8e8ea0",
      dark: "#4a4a5a",
    },
    success: {
      main: "#16a34a",
      light: "#4ade80",
      dark: "#15803d",
    },
    warning: {
      main: "#f59e0b",
      light: "#fcd34d",
      dark: "#b45309",
    },
    error: {
      main: "#dc2626",
      light: "#f87171",
      dark: "#b91c1c",
    },
    info: { main: "#0ea5e9" },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#0d0d0d",
      secondary: "#6e6e80",
      disabled: "#acacbe",
    },
    divider: "#e8e8e8",
    action: {
      hover: "rgba(0,0,0,0.05)",
      selected: "rgba(0,0,0,0.07)",
      disabled: "rgba(0,0,0,0.26)",
    },
  },
  typography,
  shape: { borderRadius: 8 },
  spacing: 9,
  components: getComponents("light"),
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0ea5e9",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#8e8ea0",
      light: "#acacbe",
      dark: "#6e6e80",
    },
    success: {
      main: "#4ade80",
      light: "#86efac",
      dark: "#22c55e",
    },
    warning: {
      main: "#fbbf24",
      light: "#fde68a",
      dark: "#f59e0b",
    },
    error: {
      main: "#f87171",
      light: "#fca5a5",
      dark: "#ef4444",
    },
    info: { main: "#38bdf8" },
    background: {
      default: "#212121",
      paper: "#2a2a2a",
    },
    text: {
      primary: "#ececec",
      secondary: "#8e8ea0",
      disabled: "#6e6e80",
    },
    divider: "#2f2f2f",
    action: {
      hover: "rgba(255,255,255,0.06)",
      selected: "rgba(255,255,255,0.08)",
      disabled: "rgba(255,255,255,0.3)",
    },
  },
  typography,
  shape: { borderRadius: 8 },
  spacing: 9,
  components: getComponents("dark"),
});
