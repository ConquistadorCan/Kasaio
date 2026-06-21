import { getDb } from '../db/connection.js'
import { type Account, type NewAccount } from '@kasaio/shared'

export class AccountRepository {
  findAll(): Account[] {
    return getDb().prepare('SELECT * FROM accounts').all() as Account[]
  }

  findById(id: number): Account | undefined {
    const row = getDb()
      .prepare('SELECT * FROM accounts WHERE id = ?')
      .get(id) as Account | undefined
  
    return row
  }

  create(data: NewAccount): Account {
    const result = getDb()
      .prepare('INSERT INTO accounts (name, account_type, currency) VALUES (?, ?, ?)')
      .run(data.name, data.account_type, data.currency)

    const newId = result.lastInsertRowid as number
    
    const newAccount = this.findById(newId)

    return newAccount!
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

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM accounts WHERE id = ?').run(id)
    return result.changes > 0
  }
}
