<div align="center">
  <img src="app-icon.svg" width="80" alt="Blueprint Logo" />

  <h1>Blueprint</h1>

  <p><strong>Desktop app for managing clients, services, and notes</strong></p>

  <p>
    Cross-platform Tauri + React app: chat, client database, service catalog, notes, and settings in one window. Command palette for quick navigation.
  </p>

  <p>
    <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-555?style=flat-square" alt="Platform" />
    <img src="https://img.shields.io/badge/built%20with-Tauri%202-24C8D8?style=flat-square&logo=tauri" alt="Tauri" />
    <img src="https://img.shields.io/badge/frontend-React%2018-61DAFB?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/backend-Rust-CE4226?style=flat-square&logo=rust" alt="Rust" />
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  </p>
</div>

---

## Features

- **Chat** — messaging and history
- **Clients** — client database
- **Services** — service catalog
- **Notes** — quick notes
- **Settings** — light/dark theme, app preferences
- **Command palette** — `Ctrl+K` / `Cmd+K` for quick navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri 2](https://tauri.app/) |
| Frontend | React 18, TypeScript, Vite |
| UI | MUI, Framer Motion |
| State | Zustand |
| Routing | React Router DOM 6 |
| Backend | Rust (Tauri plugins: store, notification, global-shortcut) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/) for your OS

### Development

```bash
git clone https://github.com/querifire/blueprint.git
cd blueprint
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Installers are output to `src-tauri/target/release/bundle/` (Windows: `.msi`/`.exe`, macOS: `.dmg`, Linux: `.deb`/`.AppImage`).

---

## License

[MIT](LICENSE)
