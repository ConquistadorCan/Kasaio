# kasaio

A desktop application for tracking income and expenses.

## Features

- Create and manage transactions with amount, date, description, and type (income/expense)
- Create custom categories and assign them to transactions
- Summary view of your financial activity

## Download

Coming soon.

## Development

### Architecture

Kasaio is a [Tauri](https://tauri.app) desktop application with three distinct layers:

- **Frontend** — React + TypeScript + Vite, served inside the Tauri webview
- **Backend** — FastAPI (Python) running as a Tauri [sidecar](https://tauri.app/develop/sidecar/) process. It listens on a random free port and exposes a REST API consumed by the frontend.
- **Desktop shell** — Tauri (Rust) handles the native window, system tray, and bundles both the frontend and the Python sidecar into a single distributable.

### Prerequisites

- [Rust](https://rustup.rs) — required by Tauri to compile the native shell
- [Node.js](https://nodejs.org) (LTS) — for the frontend build toolchain and the `npm` scripts
- [Python](https://python.org) 3.11+ — for the FastAPI backend

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/kasaio.git
   cd kasaio
   ```

2. Install frontend dependencies

   ```bash
   npm install
   ```

3. Set up the Python virtual environment and install dependencies
   ```bash
   cd src-backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

### Running in Development Mode

Start the Tauri dev server, which concurrently launches the Vite dev server (frontend) and the Tauri shell (native window):

```bash
npm run tauri dev
```

> **Note:** In dev mode the Python backend still needs to be started separately if you want live API responses. Run `python src-backend/main.py` in a separate terminal with the virtual environment activated. The backend prints its port to stdout (`KASAIO_API_PORT=<port>`), which Tauri reads to connect the frontend to the correct address.

### Project Structure

```
kasaio/
├── src/                  # React + TypeScript frontend
├── src-backend/          # FastAPI Python backend (Tauri sidecar)
│   ├── main.py           # FastAPI app entry point; picks a free port at startup
│   ├── database.py       # Async SQLite connection setup (aiosqlite)
│   ├── alembic/          # Database migration scripts
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── routers/          # FastAPI route definitions (categories, transactions)
│   ├── services/         # Business logic layer consumed by routers
│   └── enums/            # Shared enumerations (e.g. transaction type)
├── src-tauri/            # Tauri Rust shell and bundler configuration
├── index.html            # Vite entry point
├── vite.config.ts
└── package.json
```

## Build

The build process has two stages handled by a single command:

1. **Package the Python backend** — PyInstaller bundles `src-backend/main.py` and all its dependencies into a standalone `python-sidecar.exe`, then copies it into `src-tauri/binaries/` so Tauri can embed it.
2. **Build the Tauri application** — Tauri compiles the Rust shell, bundles the frontend, and produces the final installer.

```bash
npm run build:all
```

The `.msi` installer will be available at `src-tauri/target/release/bundle/msi/`.
