# Changelog

All notable changes to Kasaio will be documented in this file.

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
