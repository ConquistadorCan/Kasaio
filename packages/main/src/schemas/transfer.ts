export interface Transfer {
  id:               number
  from_account_id:  number
  to_account_id:    number
  exchange_rate:    number
  transferred_at:   string
}

export type NewTransfer = Omit<Transfer, 'id'>
