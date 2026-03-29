export type TransactionType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TransactionType;
  currency: "TRY" | "USD";
  date: string;
  description: string | null;
  category_id: number | null;
}
