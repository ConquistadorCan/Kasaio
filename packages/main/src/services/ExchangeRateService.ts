import { ExchangeRateRepository } from '../repositories/ExchangeRateRepository.js'
import { NotFoundError, ErrorCode, type ExchangeRate, type NewExchangeRate } from '@kasaio/shared'
import { ExchangeRate as ExchangeRateDomain } from '../domain/ExchangeRate.js'

export class ExchangeRateService {
  constructor(private repository: ExchangeRateRepository) {}

  getAll(): ExchangeRate[] {
    return this.repository.findAll()
  }

  getById(id: number): ExchangeRate {
    const rate = this.repository.findById(id)

    if (!rate) {
      throw new NotFoundError(ErrorCode.EXCHANGE_RATE_NOT_FOUND, `Exchange rate with id ${id} not found.`, { id })
    }

    return rate
  }

  create(data: NewExchangeRate): ExchangeRate {
    // Result discarded; called only to enforce the from != to currency rule.
    ExchangeRateDomain.fromDecimal(data.rate, data.from_currency, data.to_currency)

    return this.repository.create(data)
  }

  delete(id: number): void {
    this.getById(id)
    this.repository.delete(id)
  }
}
