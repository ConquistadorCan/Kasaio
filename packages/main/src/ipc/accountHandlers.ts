import { ipcMain } from 'electron'
import { AppError, ok, error } from '@kasaio/shared'
import type { Result } from '@kasaio/shared'
import type { AccountService } from '../services/AccountService.js'

function withResult<T>(action: () => T): Result<T> {
  try {
    return ok(action())
  } catch (caughtError) {
    if (caughtError instanceof AppError) return error(caughtError.toSerializable())
    return error({ name: 'UnknownError', code: 'UNKNOWN' as never, message: String(caughtError) })
  }
}

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
