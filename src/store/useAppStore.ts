import { create } from "zustand";
import type { Category, Transaction, TransactionType } from "../types";

interface AppStore {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
}

function generateId(): string {
  return crypto.randomUUID();
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: generateId(), name: "Salary", color: "#34d399", type: "income" },
  { id: generateId(), name: "Freelance", color: "#a78bfa", type: "income" },
  { id: generateId(), name: "Food & Drink", color: "#f87171", type: "expense" },
  { id: generateId(), name: "Subscriptions", color: "#fbbf24", type: "expense" },
  { id: generateId(), name: "Transport", color: "#60a5fa", type: "expense" },
];

export const useAppStore = create<AppStore>((set) => ({
  transactions: [],
  categories: DEFAULT_CATEGORIES,

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [{ ...transaction, id: generateId() }, ...state.transactions],
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
      categories: [...state.categories, { ...category, id: generateId() }],
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

export function selectCategoriesByType(
  categories: Category[],
  type: TransactionType
): Category[] {
  return categories.filter((c) => c.type === type);
}