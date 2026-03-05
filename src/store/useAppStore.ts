import { create } from "zustand";
import type { Category, Transaction } from "../types";

interface AppStore {
  apiPort: number | null;
  transactions: Transaction[];
  categories: Category[];
  setApiPort: (port: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setCategories: (categories: Category[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: number, updates: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: number) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: number, updates: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  apiPort: null,
  transactions: [],
  categories: [],

  setApiPort: (port) => set({ apiPort: port }),

  setTransactions: (transactions) => set({ transactions }),

  setCategories: (categories) => set({ categories }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    })),

  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),
}));