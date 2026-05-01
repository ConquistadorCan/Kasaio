# Changelog

All notable changes to Kasaio will be documented in this file.

## [2.1.0] - 2026-05-01

### Added

- Added a new Insights page with income/expense trends, savings-rate KPIs, and category breakdowns.
- Added a persistent settings drawer with category management, price-source status, wallet preference, app version, and update controls.
- Added reusable UI primitives for page headers, section headers, stats, pills, empty states, charts, sparklines, and modals.

### Improved

- Refreshed the main application shell with a compact sidebar, top breadcrumb bar, updated typography, and consistent surface/table styling.
- Redesigned dashboard, transactions, categories, portfolio, BES, ETF, TEFAS, crypto, commodities, Eurobond, price update, and investment transaction screens.
- Added wallet-view persistence for TRY/USD-focused cash-flow and insight views.
- Improved development setup docs for `.venv`, Windows activation, and Linux Tauri prerequisites.

### Fixed

- Improved local Tauri development by supporting both `.venv` and `venv` Python environments across platforms.
- Added a debug sidecar placeholder during Tauri development so missing sidecar binaries do not block local startup.
- Removed unused TypeScript symbols that blocked the production frontend build.

## [2.0.3] - 2026-05-01

### Fixed

- Fixed intermittent startup failure where the frontend gave up before the backend finished initializing.
- Repaired the Tauri startup handshake by invoking `frontend_ready` as a command instead of emitting it as an event.
- Stored backend startup failures in Tauri state so the frontend can still display the failure if it missed the original event.

## [2.0.2] - 2026-03-31

### Fixed

- Alembic migrations running on wrong database (`./kasaio.db`) instead of the app data directory — investment tables were never created in the real database
- App stuck on loading screen forever due to `backend-ready` event name mismatch (frontend was listening for `backend_ready`)
- App stuck on loading screen silently when data loading failed on retry (error was swallowed due to `loaded` flag set too early)
- App stuck on loading screen with no error when backend crashes before startup (now shows error and writes to log)
- Missing `greenlet` and SQLite dialect imports in packaged executable
- Updater plugin not registered in Tauri, preventing update notifications from working
- Silent asset price fetch errors at startup now logged (previously swallowed unless it was a 404)

### Improved

- Unified `frontend.log` and `backend.log` into a single `kasaio.log` file
- All log entries now include timestamps across frontend, backend, and Tauri layers
- Log rotation: `kasaio.log` automatically rotates to `kasaio.log.bak` when it exceeds 5 MB
- Tauri startup events (frontend ready, backend ready) now written to `kasaio.log` in release builds
- Backend HTTP request logging middleware — every API call logged with method, path, status, and duration
- Backend log levels now correctly use `WARNING` for not-found and validation failures instead of `INFO`
- `ValueError` business rule violations (e.g. selling more than held) logged before being returned as 400
- Frontend `ApiError` class carries HTTP status code — enables precise error handling by status
- Added `logInfo` to frontend logger for non-error lifecycle events (app init, update available/dismissed)

## [2.0.1] - 2026-03-30

### Fixed

- Alembic migrations not running in packaged executable (missing files in bundle)

## [2.0.0] - 2026-03-30

### Added

- **Investments module** — track commodities, cryptocurrencies, TEFAS funds, ETFs, and Eurobonds in a unified portfolio
- **Portfolio page** — all holdings in one view with current value, cost basis, and total P&L
- **Dedicated sub-pages** per asset class (Commodities, Crypto, TEFAS Funds, ETFs, Eurobonds)
- **INCOME transaction type** — record dividends, coupons, and fund distributions; included in P&L calculations
- **Realized P&L tracking** — profit/loss from SELL transactions tracked cumulatively per holding
- **Closed positions** — holdings with zero quantity shown in a collapsible section with realized P&L and percentage
- **Eurobond details** — set face value, coupon rate, coupon frequency, first coupon date, and maturity date per bond
- **Coupon calendar** — year overview with per-month income totals; drill into a month for day-level view; one-click coupon income recording with pre-filled modal
- **Exchange rate management** — USD/TRY rates for consistent portfolio valuation
- **Latest price tracking** — per-asset price history used across portfolio and dashboard
- **Dashboard investments section** — portfolio value, cost, and P&L stats; active holdings table with income-adjusted P&L
- **Asset grouping in modals** — buy/sell dropdowns group assets by type; sell mode highlights owned holdings first with quantity and average cost strip

### Fixed

- Holding quantity and average cost miscalculation on consecutive BUY/SELL transactions
- Transaction type naming conversion causing API errors

## [1.2.0] - 2026-03-15

### Added

- Delete confirmation dialog for transactions
- Splash screen on app launch
- Improved error handling with user-facing messages

### Fixed

- Transaction update not saving correctly

## [1.1.2] - 2026-03-11

### Fixed

- Auto-updater now correctly generates and signs artifacts during release build

## [1.1.1] - 2026-03-11

### Fixed

- Auto-updater artifacts now correctly generated and signed during release build

## [1.1.0] - 2026-03-11

### Added

- Auto-updater: the app now checks for updates on launch and prompts the user to install if a new version is available

## [1.0.1] - 2026-03-11

### Fixed

- GitHub Actions build: create binaries directory before copying sidecar

## [1.0.0] - 2026-03-11

### Added

- Create and manage transactions with amount, date, description, and type (income/expense)
- Create custom categories and assign them to transactions
- Summary view of financial activity
