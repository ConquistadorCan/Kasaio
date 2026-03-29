import { api } from "../lib/api";
import type { Transaction, TransactionType } from "../types";

interface TransactionCreatePayload {
  amount: number;
  type: TransactionType;
  currency?: string;
  date: string;
  description?: string | null;
  category_id?: number | null;
}

interface TransactionUpdatePayload {
  amount?: number;
  type?: TransactionType;
  date?: string;
  description?: string | null;
  category_id?: number | null;
}

export const transactionsApi = {
  list: () => api.get<Transaction[]>("/transactions/"),

  create: (payload: TransactionCreatePayload) =>
    api.post<Transaction>("/transactions/", payload),

  update: (id: number, payload: TransactionUpdatePayload) =>
    api.patch<Transaction>(`/transactions/${id}`, payload),

  delete: (id: number) => api.delete(`/transactions/${id}`),
};
