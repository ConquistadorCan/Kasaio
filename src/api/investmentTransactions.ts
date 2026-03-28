import { api } from "../lib/api";
import type { InvestmentTransaction } from "../types/investments";

interface InvestmentTransactionCreate {
  asset_id: number;
  transaction_type: "BUY" | "SELL" | "INCOME";
  quantity: number;
  price: number;
  date: string;
}

export const investmentTransactionsApi = {
  list: () => api.get<InvestmentTransaction[]>("/investment-transactions/"),
  get: (id: number) => api.get<InvestmentTransaction>(`/investment-transactions/${id}`),
  create: (payload: InvestmentTransactionCreate) =>
    api.post<InvestmentTransaction>("/investment-transactions/", payload),
};