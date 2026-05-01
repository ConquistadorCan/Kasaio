import type { Transaction, TransactionType } from "../../types";

export type FilterType = "all" | TransactionType;

export interface TransactionFormData {
  description: string;
  type: TransactionType;
  currency: "TRY" | "USD";
  category_id: string;
  amount: string;
  date: string;
  _readonly?: boolean;
}

export type CashFlowRow = Transaction & { _readonly?: boolean };

export const EMPTY_FORM: TransactionFormData = {
  description: "",
  type: "expense",
  currency: "TRY",
  category_id: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
};

export const DAY_PICKER_CLASS_NAMES = {
  root: "dp-root",
  months: "dp-months",
  month: "dp-month",
  month_caption: "hidden",
  month_grid: "dp-month-grid",
  weekdays: "dp-weekdays",
  weekday: "dp-weekday",
  weeks: "dp-weeks",
  week: "dp-week",
  day: "dp-day",
  day_button: "dp-day-btn",
  selected: "dp-selected",
  today: "dp-today",
  outside: "dp-outside",
  disabled: "dp-disabled",
} as const;

export const DAY_PICKER_RANGE_CLASS_NAMES = {
  ...DAY_PICKER_CLASS_NAMES,
  selected: "dp-selected",
  range_start: "dp-range-start",
  range_end: "dp-range-end",
  range_middle: "dp-range-mid",
} as const;

export const TYPE_BADGE: Record<TransactionType, { label: string; className: string }> = {
  income: {
    label: "Income",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  expense: {
    label: "Expense",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};