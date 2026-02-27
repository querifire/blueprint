import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface SettingsState {
  theme: "light" | "dark" | "system";
  overlayHotkey: string;
  voiceHotkey: string;
  overlayPosition: string;
  notifyDaysBefore: number;
  aiProvider: string;
  aiModel: string;
  aiBaseUrl: string;
  voiceProvider: string;
  loadSettings: () => Promise<void>;
  saveSetting: (key: string, value: string) => Promise<void>;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: "system",
  overlayHotkey: "Ctrl+Shift+B",
  voiceHotkey: "Ctrl+Shift+V",
  overlayPosition: "bottom-right",
  notifyDaysBefore: 7,
  aiProvider: "openai",
  aiModel: "gpt-4o-mini",
  aiBaseUrl: "",
  voiceProvider: "openai",

  loadSettings: async () => {
    try {
      const settings = await invoke<Record<string, string>>("get_settings");
      set({
        theme: (settings.theme as "light" | "dark" | "system") || "system",
        overlayHotkey: settings.overlay_hotkey || "Ctrl+Shift+B",
        voiceHotkey: settings.voice_hotkey || "Ctrl+Shift+V",
        overlayPosition: settings.overlay_position || "bottom-right",
        notifyDaysBefore: parseInt(settings.notify_days_before || "7", 10),
        aiProvider: settings.ai_provider || "openai",
        aiModel: settings.ai_model || "gpt-4o-mini",
        aiBaseUrl: settings.ai_base_url || "",
        voiceProvider: settings.voice_provider || "openai",
      });
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  },

  saveSetting: async (key: string, value: string) => {
    await invoke("save_setting", { key, value });
    const stateMap: Record<string, Partial<SettingsState>> = {
      overlay_hotkey: { overlayHotkey: value },
      voice_hotkey: { voiceHotkey: value },
      overlay_position: { overlayPosition: value },
      notify_days_before: { notifyDaysBefore: parseInt(value, 10) },
      ai_provider: { aiProvider: value },
      ai_model: { aiModel: value },
      ai_base_url: { aiBaseUrl: value },
      theme: { theme: value as "light" | "dark" | "system" },
      voice_provider: { voiceProvider: value },
    };
    if (stateMap[key]) set(stateMap[key] as Partial<SettingsState>);
  },

  setTheme: (theme) => {
    set({ theme });
    invoke("save_setting", { key: "theme", value: theme });
  },
}));
