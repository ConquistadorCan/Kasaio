import { Currency, BusinessRuleError, ErrorCode } from '@kasaio/shared'
import { Money } from './Money.js'

const PRECISION = 1_000_000

export class ExchangeRate {
  private constructor(
    private readonly _stored: number,
    readonly from: Currency,
    readonly to: Currency,
  ) {}

  static fromDecimal(rate: number, from: Currency, to: Currency): ExchangeRate {
    if (from === to) throw new BusinessRuleError(ErrorCode.SAME_CURRENCY_EXCHANGE_RATE, `Exchange rate currencies must differ: ${from}`, { currency: from })
    return new ExchangeRate(Math.round(rate * PRECISION), from, to)
  }

  static fromStored(rate: number, from: Currency, to: Currency): ExchangeRate {
    if (from === to) throw new BusinessRuleError(ErrorCode.SAME_CURRENCY_EXCHANGE_RATE, `Exchange rate currencies must differ: ${from}`, { currency: from })
    return new ExchangeRate(rate, from, to)
  }

  toStored(): number {
    return this._stored
  }

  toDecimal(): number {
    return this._stored / PRECISION
  }

  format(): string {
    return this.toDecimal().toFixed(6)
  }

  convert(money: Money): Money {
    return Money.fromDecimal(money.toDecimal() * this.toDecimal(), this.to)
  }
}
