import { z } from 'zod'
import { TransactionResponseSchema } from './transaction.js'

// DB row: links two transactions. exchange_rate is stored scaled by
// ExchangeRate.PRECISION (see domain/ExchangeRate.ts), not a plain decimal.
export const TransferSchema = z.object({
  id:                  z.number(),
  from_transaction_id: z.number(),
  to_transaction_id:   z.number(),
  exchange_rate:       z.number().int().nullable(),
})
export type Transfer = z.infer<typeof TransferSchema>

export const NewTransferSchema = TransferSchema.omit({ id: true })
export type NewTransfer = z.infer<typeof NewTransferSchema>

// What the client sends. The service creates both transactions and the link row.
// `exchange_rate` is needed only when the two accounts use different currencies.
export const TransferRequestSchema = z.object({
  from_account_id: z.number().int(),
  to_account_id:   z.number().int(),
  amount:          z.number().positive(),
  exchange_rate:   z.number().positive().nullable().optional(),
  transacted_at:   z.iso.datetime({ offset: true }),
  description:     z.string().nullable().optional(),
})
export type TransferRequest = z.infer<typeof TransferRequestSchema>

// What the client gets back: the link row plus both created transactions.
export const TransferResponseSchema = TransferSchema.extend({
  exchange_rate:           z.number().nullable(),
  exchange_rate_formatted: z.string().nullable(),
  from_transaction:        TransactionResponseSchema,
  to_transaction:          TransactionResponseSchema,
})
export type TransferResponse = z.infer<typeof TransferResponseSchema>
