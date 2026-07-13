import type { NewCategory } from '@kasaio/shared'

const invoke = window.electronAPI.invoke

export const categoriesApi = {
  getAll: () => invoke('categories:get-all', {}),
  getById: (id: number) => invoke('categories:get-by-id', { id }),
  create: (data: NewCategory) => invoke('categories:create', data),
  update: (id: number, data: Partial<NewCategory>) => invoke('categories:update', { id, data }),
  delete: (id: number) => invoke('categories:delete', { id }),
}
