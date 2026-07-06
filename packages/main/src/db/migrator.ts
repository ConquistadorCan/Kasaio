import { Umzug, MigrationParams } from 'umzug'
import type Database from 'better-sqlite3'
import { getDb } from './connection.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function createStorage(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY NOT NULL,
      run_at TEXT NOT NULL
    )
  `)

  return {
    async logMigration({ name }: MigrationParams<Database.Database>) {
      db.prepare('INSERT INTO migrations (name, run_at) VALUES (?, ?)').run(name, new Date().toISOString())
    },
    async unlogMigration({ name }: MigrationParams<Database.Database>) {
      db.prepare('DELETE FROM migrations WHERE name = ?').run(name)
    },
    async executed() {
      return db.prepare('SELECT name FROM migrations ORDER BY name').all().map((r: any) => r.name)
    },
  }
}

export async function runMigrations(): Promise<void> {
  const db = getDb()

  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, 'migrations/*.js').split(path.sep).join('/'),
      resolve({ name, path: migPath }) {
        return {
          name,
          up: async () => (await import(migPath!)).up(db),
          down: async () => (await import(migPath!)).down(db),
        }
      },
    },
    storage: createStorage(db),
    logger: console,
  })

  await umzug.up()
}
