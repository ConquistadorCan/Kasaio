import { getDb } from '../db/connection.js'
import { type Transfer, type NewTransfer } from '@kasaio/shared'

export class TransferRepository {
  findById(id: number): Transfer | undefined {
    return getDb()
      .prepare('SELECT * FROM transfers WHERE id = ?')
      .get(id) as Transfer | undefined
  }

  findByTransactionId(transactionId: number): Transfer | undefined {
    return getDb()
      .prepare('SELECT * FROM transfers WHERE from_transaction_id = ? OR to_transaction_id = ?')
      .get(transactionId, transactionId) as Transfer | undefined
  }

  create(data: NewTransfer): Transfer {
    const result = getDb()
      .prepare(
        'INSERT INTO transfers (from_transaction_id, to_transaction_id, exchange_rate) VALUES (?, ?, ?)',
      )
      .run(data.from_transaction_id, data.to_transaction_id, data.exchange_rate ?? null)

    return this.findById(result.lastInsertRowid as number)!
  }

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM transfers WHERE id = ?').run(id)
    return result.changes > 0
  }
}
