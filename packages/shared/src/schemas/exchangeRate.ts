import { z } from 'zod'
import { CurrencyEnum } from '../enums/currency.js'

// DB row: rate is stored scaled by ExchangeRate.PRECISION (see domain/ExchangeRate.ts), not a plain decimal.
export const ExchangeRateSchema = z.object({
  id:            z.number(),
  from_currency: CurrencyEnum,
  to_currency:   CurrencyEnum,
  rate:          z.number().int(),
  recorded_at:   z.string(),
})
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>

export const NewExchangeRateSchema = ExchangeRateSchema.omit({ id: true })
export type NewExchangeRate = z.infer<typeof NewExchangeRateSchema>

// What the client sends: a plain decimal rate (e.g. 32.45).
export const ExchangeRateRequestSchema = ExchangeRateSchema
  .omit({ id: true, rate: true })
  .extend({
    rate: z.number().positive(),
  })
export type ExchangeRateRequest = z.infer<typeof ExchangeRateRequestSchema>

// What the client gets back: decimal rate + a formatted string.
export const ExchangeRateResponseSchema = ExchangeRateSchema.extend({
  rate:           z.number(),
  rate_formatted: z.string(),
})
export type ExchangeRateResponse = z.infer<typeof ExchangeRateResponseSchema>
