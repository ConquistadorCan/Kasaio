import type { Currency, TransactionType } from '@kasaio/shared'

const CENTS = 100

const LOCALE = 'tr-TR'

export class Money {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency,
  ) {}

  static fromMinorUnits(amount: number, currency: Currency): Money {
    return new Money(amount, currency)
  }

  static fromDecimal(amount: number, currency: Currency): Money {
    return new Money(Math.round(amount * CENTS), currency)
  }

  static toSignedAmount(amount: number, type: TransactionType): number {
    if (type === 'transfer') return amount
    return type === 'income' ? Math.abs(amount) : -Math.abs(amount)
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    return new Money(this.amount - other.amount, this.currency)
  }

  toMinorUnits(): number {
    return this.amount
  }

  toDecimal(): number {
    return this.amount / CENTS
  }

  format(): string {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency: this.currency,
    }).format(this.toDecimal())
  }
}
