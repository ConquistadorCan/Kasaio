import { z } from 'zod'

export const CurrencyEnum = z.enum(['TRY', 'USD', 'CAD', 'EUR'])
export type Currency = z.infer<typeof CurrencyEnum>
