import { z } from 'zod'
import { CurrencyEnum } from '../enums/currency.js'

export const ExchangeRateSchema = z.object({
  id:            z.number(),
  from_currency: CurrencyEnum,
  to_currency:   CurrencyEnum,
  rate:          z.number(),
  recorded_at:   z.string(),
})
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>

export const NewExchangeRateSchema = ExchangeRateSchema.omit({ id: true })
export type NewExchangeRate = z.infer<typeof NewExchangeRateSchema>

export const ExchangeRateResponseSchema = ExchangeRateSchema.extend({
  rateFormatted: z.string(),
})
export type ExchangeRateResponse = z.infer<typeof ExchangeRateResponseSchema>
