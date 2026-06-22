import type { NewAccount } from '@kasaio/shared'

const invoke = window.electronAPI.invoke

export const accountsApi = {
  getAll: () => invoke('accounts:get-all'),
  getById: (id: number) => invoke('accounts:get-by-id', { id }),
  create: (data: NewAccount) => invoke('accounts:create', data),
  update: (id: number, data: Partial<NewAccount>) => invoke('accounts:update', { id, data }),
  delete: (id: number) => invoke('accounts:delete', { id }),
}
