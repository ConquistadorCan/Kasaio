import { Currency } from '../enums/currency.js'

const CENTS = 100

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  CAD: 'CA$',
  EUR: '€',
}

export class Money {
  private constructor(
    private readonly _stored: number,
    readonly currency: Currency,
  ) {}

  static fromDecimal(amount: number, currency: Currency): Money {
    return new Money(Math.round(amount * CENTS), currency)
  }

  static fromStored(amount: number, currency: Currency): Money {
    return new Money(amount, currency)
  }

  toStored(): number {
    return this._stored
  }

  toDecimal(): number {
    return this._stored / CENTS
  }

  format(): string {
    const symbol = CURRENCY_SYMBOLS[this.currency]
    return `${symbol}${this.toDecimal().toFixed(2)}`
  }
}
