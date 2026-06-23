import type { IpcChannels } from './ipc.js'

export interface KasaioAPI {
  invoke: <K extends keyof IpcChannels>(
    channel: K,
    ...args: IpcChannels[K]['request'] extends void ? [] : [IpcChannels[K]['request']]
  ) => Promise<IpcChannels[K]['response']>
}

declare global {
  interface Window {
    electronAPI: KasaioAPI
  }
}
