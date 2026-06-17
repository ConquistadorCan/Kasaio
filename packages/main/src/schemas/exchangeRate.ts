import { Currency } from './enums.js'

export interface ExchangeRate {
  id:            number
  from_currency: Currency
  to_currency:   Currency
  rate:          number
  recorded_at:   string
}

export type NewExchangeRate = Omit<ExchangeRate, 'id'>
