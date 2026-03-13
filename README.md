# kasaio

A desktop application for tracking income and expenses.

## Features

- Create and manage transactions with amount, date, description, and type (income/expense)
- Create custom categories and assign them to transactions
- Summary view of your financial activity

## Download

Download the latest `.msi` installer from [GitHub Releases](https://github.com/ConquistadorCan/Kasaio/releases/latest).

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
   git clone https://github.com/ConquistadorCan/Kasaio.git
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

```bash
npm run tauri dev
```

In dev mode, Tauri automatically spawns the Python backend using the local virtual environment. No separate terminal is needed.

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

The canonical build path is CI — every release is built and published automatically by GitHub Actions when a version tag is pushed. See [Cutting a Release](#cutting-a-release).

For local testing, a convenience script is available. It packages the Python backend with PyInstaller, copies the binary into `src-tauri/binaries/`, and runs `tauri build`:

```bash
npm run build:all
```

> **Note:** `build:all` is Windows-only and intended for local verification. Do not use it to produce release artifacts — use `npm run release` instead.

The `.msi` installer will be available at `src-tauri/target/release/bundle/msi/`.

## Versioning & Releases

Kasaio follows [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

- `PATCH` — bug fixes (e.g. `0.1.1`)
- `MINOR` — new features, backwards compatible (e.g. `0.2.0`)
- `MAJOR` — breaking changes or major milestones (e.g. `1.0.0`)

The version is defined in two places and must always be in sync:

- `tauri.conf.json` → `version`
- `package.json` → `version`

### Cutting a Release

Use the release script, which updates both version files, commits, tags, and pushes in one step:

```bash
npm run release -- 0.2.0
```

This will:

1. Update the version in `tauri.conf.json` and `package.json`
2. Commit the version bump
3. Create a `v0.2.0` git tag
4. Push the commit and the tag to GitHub

GitHub Actions picks up the tag, builds the `.msi`, and publishes it to GitHub Releases automatically.

### Branch Strategy

- `main` — stable, production-ready code. Every commit here is releasable.
- `dev` — active development branch.
- `feature/xxx` — opened from `dev` for each new feature, merged back into `dev` when done.

When a set of features is ready to ship: merge `dev` into `main`, then run `npm run release`.
