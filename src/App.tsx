import { useEffect, useMemo, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { lightTheme, darkTheme } from "./theme";
import Layout from "./components/Layout";
import Chat from "./pages/Chat";
import Clients from "./pages/Clients";
import Services from "./pages/Services";
import Notes from "./pages/Notes";
import Settings from "./pages/Settings";
import WelcomeScreen, { hasBeenWelcomed } from "./components/WelcomeScreen";
import { ToastProvider } from "./components/ToastProvider";
import CommandPalette from "./components/CommandPalette";
import { useSettingsStore } from "./stores/settingsStore";
import { invoke } from "@tauri-apps/api/core";

function AppInner() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <HashRouter>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <Routes>
          <Route path="/" element={<Layout onOpenPalette={() => setPaletteOpen(true)} />}>
            <Route index element={<Chat />} />
            <Route path="clients" element={<Clients />} />
            <Route path="services" element={<Services />} />
            <Route path="notes" element={<Notes />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default function App() {
  const { theme, loadSettings } = useSettingsStore();
  const [showWelcome, setShowWelcome] = useState(() => !hasBeenWelcomed());

  useEffect(() => {
    loadSettings();
    invoke("check_and_notify").catch(() => {});
  }, [loadSettings]);

  const muiTheme = useMemo(() => {
    if (theme === "dark") return darkTheme;
    if (theme === "light") return lightTheme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? darkTheme : lightTheme;
  }, [theme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ToastProvider>
        {showWelcome && <WelcomeScreen onContinue={() => setShowWelcome(false)} />}
        <AppInner />
      </ToastProvider>
    </ThemeProvider>
  );
}
