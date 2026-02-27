import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import App from "./App";
import Overlay from "./components/Overlay";
import VoiceIndicator from "./components/VoiceIndicator";

function bootstrap() {
  const appWindow = getCurrentWindow();
  const label = appWindow.label;
  const root = document.getElementById("root")!;

  if (label === "voice-indicator") {
    document.documentElement.style.cssText = "background:transparent!important;margin:0;padding:0";
    document.body.style.cssText = "background:transparent!important;margin:0;padding:0";
    ReactDOM.createRoot(root).render(<VoiceIndicator />);
  } else if (label === "overlay") {
    ReactDOM.createRoot(root).render(<Overlay />);
  } else {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

bootstrap();
