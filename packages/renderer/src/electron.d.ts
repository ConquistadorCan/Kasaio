import type { IpcChannels } from '@kasaio/shared'

export {}

declare global {
  interface Window {
    electronAPI: {
      invoke: <K extends keyof IpcChannels>(
        channel: K,
        ...args: IpcChannels[K]['request'] extends void
          ? []
          : [IpcChannels[K]['request']]
      ) => Promise<IpcChannels[K]['response']>
    }
  }
}
