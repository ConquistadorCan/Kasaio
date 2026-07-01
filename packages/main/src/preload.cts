import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannels } from '@kasaio/shared' with { 'resolution-mode': 'import' }

const electronAPI = {
  invoke: <K extends keyof IpcChannels>(
    channel: K,
    ...args: IpcChannels[K]['request'] extends void ? [] : [IpcChannels[K]['request']]
  ): Promise<IpcChannels[K]['response']> => ipcRenderer.invoke(channel, ...args),
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
