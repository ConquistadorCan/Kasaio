import { ipcMain } from 'electron'
import type { CategoryService } from '../services/CategoryService.js'
import type { CategoryType } from '@kasaio/shared'
import { withResult } from './utils.js'

export function registerCategoryHandlers(categoryService: CategoryService): void {
  ipcMain.handle('categories:get-all', (_event, { type }: { type?: CategoryType }) =>
    withResult(() => categoryService.getAll(type)),
  )

  ipcMain.handle('categories:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => categoryService.getById(id)),
  )

  ipcMain.handle('categories:create', (_event, data) =>
    withResult(() => categoryService.create(data)),
  )

  ipcMain.handle('categories:update', (_event, { id, data }: { id: number; data: Parameters<CategoryService['update']>[1] }) =>
    withResult(() => categoryService.update(id, data)),
  )

  ipcMain.handle('categories:delete', (_event, { id }: { id: number }) =>
    withResult(() => categoryService.delete(id)),
  )
}
