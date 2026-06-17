import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'kasaio.db')

  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('foreign_keys = ON')

  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
