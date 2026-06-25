import { ipcMain } from 'electron'
import type { AccountService } from '../services/AccountService.js'
import { withResult } from './utils.js'

export function registerAccountHandlers(accountService: AccountService): void {
  ipcMain.handle('accounts:get-all', () =>
    withResult(() => accountService.getAll()),
  )

  ipcMain.handle('accounts:get-by-id', (_event, { id }: { id: number }) =>
    withResult(() => accountService.getById(id)),
  )

  ipcMain.handle('accounts:create', (_event, data) =>
    withResult(() => accountService.create(data)),
  )

  ipcMain.handle('accounts:update', (_event, { id, data }: { id: number; data: Parameters<AccountService['update']>[1] }) =>
    withResult(() => accountService.update(id, data)),
  )

  ipcMain.handle('accounts:delete', (_event, { id }: { id: number }) =>
    withResult(() => accountService.delete(id)),
  )
}
