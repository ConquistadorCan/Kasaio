import type Database from 'better-sqlite3'

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL UNIQUE,
      account_type TEXT    NOT NULL CHECK (account_type IN ('cash', 'investment')),
      currency     TEXT    NOT NULL CHECK (currency IN ('TRY', 'USD', 'CAD', 'EUR'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL UNIQUE,
      category_type TEXT    NOT NULL CHECK (category_type IN ('income', 'expense'))
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT    NOT NULL CHECK (from_currency IN ('TRY', 'USD', 'CAD', 'EUR')),
      to_currency   TEXT    NOT NULL CHECK (to_currency   IN ('TRY', 'USD', 'CAD', 'EUR')),
      rate          REAL    NOT NULL,
      recorded_at   TEXT    NOT NULL,
      CHECK (from_currency != to_currency)
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      from_account_id INTEGER NOT NULL REFERENCES accounts(id),
      to_account_id   INTEGER NOT NULL REFERENCES accounts(id),
      exchange_rate   REAL    NOT NULL,
      transferred_at  TEXT    NOT NULL,
      CHECK (from_account_id != to_account_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id       INTEGER NOT NULL REFERENCES accounts(id),
      category_id      INTEGER REFERENCES categories(id),
      transaction_type TEXT    NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
      amount           INTEGER NOT NULL,
      currency         TEXT    NOT NULL CHECK (currency IN ('TRY', 'USD', 'CAD', 'EUR')),
      transacted_at    TEXT    NOT NULL,
      description      TEXT
    );
  `)
}

export function down(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS transfers;
    DROP TABLE IF EXISTS exchange_rates;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS accounts;
  `)
}
