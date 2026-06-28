import { getDb } from '../db/connection.js'
import { type Transaction, type NewTransaction } from '@kasaio/shared'

export class TransactionRepository {
  findAll(filters: { accountId?: number; categoryId?: number; from?: string; to?: string } = {}): Transaction[] {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.accountId != null) { conditions.push('account_id = ?'); params.push(filters.accountId) }
    if (filters.categoryId != null) { conditions.push('category_id = ?'); params.push(filters.categoryId) }
    if (filters.from != null) { conditions.push('transacted_at >= ?'); params.push(filters.from) }
    if (filters.to != null) { conditions.push('transacted_at <= ?'); params.push(filters.to) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    return getDb().prepare(`SELECT * FROM transactions ${where} ORDER BY transacted_at DESC`).all(...params) as Transaction[]
  }

  existsByCategoryId(categoryId: number): boolean {
    const row = getDb()
      .prepare('SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1')
      .get(categoryId)
    return row !== undefined
  }

  findById(id: number): Transaction | undefined {
    return getDb()
      .prepare('SELECT * FROM transactions WHERE id = ?')
      .get(id) as Transaction | undefined
  }

  create(data: NewTransaction): Transaction {
    const result = getDb()
      .prepare(
        'INSERT INTO transactions (account_id, category_id, transaction_type, amount, currency, transacted_at, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        data.account_id,
        data.category_id ?? null,
        data.transaction_type,
        data.amount,
        data.currency,
        data.transacted_at,
        data.description ?? null,
      )

    return this.findById(result.lastInsertRowid as number)!
  }

  update(id: number, data: Partial<NewTransaction>): Transaction | undefined {
    const fields = Object.keys(data) as (keyof NewTransaction)[]
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(f => `${f} = ?`).join(', ')
    const values = fields.map(f => data[f])

    const result = getDb()
      .prepare(`UPDATE transactions SET ${setClause} WHERE id = ?`)
      .run(...values, id)

    if (result.changes === 0) return undefined

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id)
    return result.changes > 0
  }
}
