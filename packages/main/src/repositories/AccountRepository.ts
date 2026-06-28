import { getDb } from '../db/connection.js'
import { type Account, type NewAccount } from '@kasaio/shared'

// SQLite has no boolean; is_active is stored as 0/1 and turned into true/false here.
type AccountRow = Omit<Account, 'is_active'> & { is_active: number }

function toAccount(row: AccountRow): Account {
  return { ...row, is_active: row.is_active === 1 }
}

export class AccountRepository {
  findAll(): Account[] {
    return (getDb()
      .prepare('SELECT * FROM accounts WHERE is_active = 1')
      .all() as AccountRow[])
      .map(toAccount)
  }

  findById(id: number): Account | undefined {
    const row = getDb()
      .prepare('SELECT * FROM accounts WHERE id = ?')
      .get(id) as AccountRow | undefined

    return row ? toAccount(row) : undefined
  }

  findByName(name: string): Account | undefined {
    const row = getDb()
      .prepare('SELECT * FROM accounts WHERE name = ?')
      .get(name) as AccountRow | undefined

    return row ? toAccount(row) : undefined
  }

  create(data: NewAccount): Account {
    const result = getDb()
      .prepare('INSERT INTO accounts (name, account_type, currency, linked_cash_account_id) VALUES (?, ?, ?, ?)')
      .run(data.name, data.account_type, data.currency, data.linked_cash_account_id ?? null)

    return this.findById(result.lastInsertRowid as number)!
  }

  update(id: number, data: Partial<NewAccount>): Account | undefined {
    const fields = Object.keys(data) as (keyof NewAccount)[]
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => data[f])

    const result = getDb()
      .prepare(`UPDATE accounts SET ${setClause} WHERE id = ?`)
      .run(...values, id)

    if (result.changes === 0) return undefined

    return this.findById(id)
  }

  // Soft delete: the account is hidden but its transactions stay.
  softDelete(id: number): boolean {
    const result = getDb()
      .prepare('UPDATE accounts SET is_active = 0 WHERE id = ?')
      .run(id)
    return result.changes > 0
  }
}
