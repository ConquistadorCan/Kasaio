import type { TransactionType } from "../../types";

export type FilterType = "all" | TransactionType;

export interface TransactionFormData {
  description: string;
  type: TransactionType;
  category_id: string;
  amount: string;
  date: string;
}

export const EMPTY_FORM: TransactionFormData = {
  description: "",
  type: "expense",
  category_id: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
};

export const TYPE_BADGE: Record<
  TransactionType,
  { label: string; className: string }
> = {
  income: {
    label: "Income",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  expense: {
    label: "Expense",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

export function formatAmount(amount: number, type: TransactionType): string {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return type === "income" ? `+ ₺${formatted}` : `− ₺${formatted}`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}
