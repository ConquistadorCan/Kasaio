import { getDb } from '../db/connection.js'
import { type ExchangeRate, type NewExchangeRate } from '@kasaio/shared'

export class ExchangeRateRepository {
  findAll(): ExchangeRate[] {
    return getDb().prepare('SELECT * FROM exchange_rates').all() as ExchangeRate[]
  }

  findById(id: number): ExchangeRate | undefined {
    return getDb()
      .prepare('SELECT * FROM exchange_rates WHERE id = ?')
      .get(id) as ExchangeRate | undefined
  }

  create(data: NewExchangeRate): ExchangeRate {
    const result = getDb()
      .prepare('INSERT INTO exchange_rates (from_currency, to_currency, rate, recorded_at) VALUES (?, ?, ?, ?)')
      .run(data.from_currency, data.to_currency, data.rate, data.recorded_at)

    return this.findById(result.lastInsertRowid as number)!
  }

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM exchange_rates WHERE id = ?').run(id)
    return result.changes > 0
  }
}
