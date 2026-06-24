import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

type UIStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useUIStore = create<UIStore>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))
