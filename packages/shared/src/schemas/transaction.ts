import { z } from 'zod'
import { CurrencyEnum } from '../enums/currency.js'

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const TransactionSchema = z.object({
  id:               z.number(),
  account_id:       z.number(),
  category_id:      z.number().nullable(),
  transaction_type: TransactionTypeSchema,
  amount:           z.number().int(),
  currency:         CurrencyEnum,
  transacted_at:    z.iso.datetime({ offset: true }),
  description:      z.string().nullable(),
})
export type Transaction = z.infer<typeof TransactionSchema>

export const NewTransactionSchema = TransactionSchema.omit({ id: true })
export type NewTransaction = z.infer<typeof NewTransactionSchema>

export const TransactionRequestSchema = TransactionSchema
  .omit({ id: true, amount: true })
  .extend({
    amount:      z.number().positive(),
    description: z.string().nullable().optional(),
  })
export type TransactionRequest = z.infer<typeof TransactionRequestSchema>

export const TransactionResponseSchema = TransactionSchema.extend({
  amount:          z.number(),
  amountFormatted: z.string(),
})
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>
