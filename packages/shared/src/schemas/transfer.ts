import { z } from 'zod'

export const TransferSchema = z.object({
  id:              z.number(),
  from_account_id: z.number(),
  to_account_id:   z.number(),
  exchange_rate:   z.number(),
  transferred_at:  z.string(),
})
export type Transfer = z.infer<typeof TransferSchema>

export const NewTransferSchema = TransferSchema.omit({ id: true })
export type NewTransfer = z.infer<typeof NewTransferSchema>
