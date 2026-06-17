export const Currency = {
  TRY: 'TRY',
  USD: 'USD',
  CAD: 'CAD',
  EUR: 'EUR',
} as const
export type Currency = typeof Currency[keyof typeof Currency]