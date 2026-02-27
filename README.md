# Blueprint

<div align="center">

![Blueprint](app-icon.svg)

**Десктопное приложение для управления клиентами, услугами и заметками**

[![Build](https://github.com/querifire/blueprint/actions/workflows/build.yml/badge.svg)](https://github.com/querifire/blueprint/actions/workflows/build.yml)

</div>

---

## О проекте

Blueprint — кроссплатформенное приложение на [Tauri](https://tauri.app) и [React](https://react.dev). Чат, клиенты, услуги, заметки и настройки в одном окне без лишних зависимостей.

## Возможности

- **Чат** — общение и история
- **Клиенты** — база клиентов
- **Услуги** — каталог услуг
- **Заметки** — быстрые заметки
- **Настройки** — тема (светлая/тёмная), параметры приложения
- **Командная палитра** — `Ctrl+K` / `Cmd+K` для быстрого перехода

## Требования

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (stable)
- Для сборки под Linux: зависимости из [документации Tauri](https://tauri.app/v1/guides/getting-started/prerequisites#linux)

## Установка и запуск

```bash
git clone https://github.com/querifire/blueprint.git
cd blueprint
npm install
npm run tauri dev
```

Сборка релиза:

```bash
npm run tauri build
```

## Сборка из исходников (кратко)

| Платформа | Действия |
|-----------|----------|
| Windows   | `npm run tauri build` → установщик в `src-tauri/target/release/bundle/` |
| macOS     | То же → `.dmg` в `src-tauri/target/release/bundle/dmg/` |
| Linux     | Установить [зависимости](https://tauri.app/v1/guides/getting-started/prerequisites#linux), затем `npm run tauri build` |

## Стек

- **Frontend:** React 18, TypeScript, Vite, MUI, Framer Motion, Zustand, React Router
- **Backend:** Tauri 2 (Rust)
- **Плагины Tauri:** store, notification, global-shortcut

## Лицензия

[MIT](LICENSE) © [querifire](https://github.com/querifire).
