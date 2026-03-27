# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kasaio** is a Tauri-based desktop app for tracking income, expenses, and investments. It uses a three-layer architecture:
- **Frontend**: React + TypeScript (Vite, Zustand, shadcn/ui, Tailwind CSS)
- **Backend**: Python FastAPI sidecar (SQLAlchemy async + SQLite, Alembic migrations)
- **Shell**: Tauri (Rust) — bundles the frontend and Python sidecar into an `.msi` installer

## Development Commands

### Frontend / Full App
```bash
npm run dev          # Start Vite dev server only (port 1420)
npm run tauri dev    # Start full Tauri app (frontend + sidecar + native shell)
npm run build        # TypeScript check + Vite production build
npm run tauri build  # Build distributable Tauri app
npm run build:all    # Full Windows build: PyInstaller → copy binary → tauri build
```

### Python Backend (run from `src-backend/`)
```bash
# Activate venv first
venv\Scripts\activate         # Windows
source venv/bin/activate      # Unix

pip install -r requirements.txt
uvicorn main:app --reload     # Run backend standalone for testing

# Migrations
alembic upgrade head          # Apply all migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

### Release
```bash
npm run release      # Bumps version and creates GitHub tag (triggers CI)
```

## Architecture

### Communication Flow
1. Tauri spawns the Python sidecar on startup
2. Sidecar finds a free port and prints `KASAIO_API_PORT=<port>` to stdout
3. Tauri captures stdout and emits an event to the frontend
4. Frontend stores the port in Zustand (`useAppStore`) via `useInitApp` hook
5. All API calls go to `http://127.0.0.1:<port>`

The base URL logic lives in [src/lib/api.ts](src/lib/api.ts).

### Frontend Structure (`src/`)
- `api/` — Typed API clients per resource (transactions, categories, assets, holdings, investmentTransactions, assetPrices, exchangeRates, portfolio)
- `pages/` — Route-level page components; investment sub-pages under `pages/investments/`
- `components/` — Shared UI (`ui/`), layout (`layout/`), feature components (`transactions/`, `investment/`)
- `store/` — Zustand stores: `useAppStore` (port, general state) and `useInvestmentStore`
- `types/` — TypeScript interfaces: `index.ts` (core), `investments.ts`
- `lib/` — `api.ts` (base URL/fetch), `formatters.ts` (number/date), `logger.ts`

### Backend Structure (`src-backend/`)
- `main.py` — FastAPI app, CORS config, router registration, startup (port selection + DB init)
- `database.py` — Async SQLAlchemy session, SQLite engine setup
- `models/` — SQLAlchemy ORM models
- `schemas/` — Pydantic request/response schemas (separate from models)
- `routers/` — Route handlers: `category_router`, `transaction_router`, `asset_router`, `holding_router`, `investment_transaction_router`, `asset_price_router`, `exchange_rate_router`, `portfolio_router`
- `services/` — Business logic (called by routers)
- `enums/` — `TransactionTypeEnum` (INCOME/EXPENSE), `AssetTypeEnum` (COMMODITY, CRYPTOCURRENCY, TEFAS_FUND, ETF, EUROBOND), `InvestmentTransactionTypeEnum` (BUY/SELL)
- `alembic/` — Migration scripts; config in `alembic.ini`

### Key Data Models
- **Transaction**: amount, type (INCOME/EXPENSE), date, description → Category
- **Category**: name (unique), 1:N Transactions
- **Asset**: symbol, name, asset_type, currency → Holdings, InvestmentTransactions, AssetPrices
- **Holding**: unique per asset, tracks quantity and average_cost (current position)
- **InvestmentTransaction**: buy/sell history per asset
- **AssetPrice**: historical price snapshots per asset
- **ExchangeRate**: currency conversion rates for TRY portfolio summaries

## Key Conventions

- All API endpoints use async SQLAlchemy sessions (passed via FastAPI `Depends`)
- CORS allows: `http://tauri.localhost`, `tauri://localhost`, `http://localhost:1420`
- Frontend path alias `@/` maps to `src/`
- shadcn/ui components use New York style with CSS variables
- The Tauri binary identifier for the Python sidecar is `python-sidecar-x86_64-pc-windows-msvc`
- Alembic migrations must be created for any model changes before they take effect
