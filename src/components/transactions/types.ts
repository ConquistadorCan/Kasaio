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

export const DAY_PICKER_CLASS_NAMES = {
  root: "text-white/80 text-sm",
months: "flex flex-col",
  month: "space-y-3",
  month_caption: "hidden",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday: "w-8 h-8 flex items-center justify-center text-[11px] text-white/20 font-medium",
  weeks: "flex flex-col gap-0.5 min-h-[192px]",
  week: "flex",
  day: "w-8 h-8 flex items-center justify-center",
  day_button: "w-8 h-8 flex items-center justify-center rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors outline-none",
  selected: "bg-violet-500/20 rounded-lg",
  today: "bg-red-500/20 rounded-lg text-red-400 font-medium",
  outside: "opacity-20",
  disabled: "opacity-20 cursor-not-allowed",
} as const;

export const DAY_PICKER_RANGE_CLASS_NAMES = {
  ...DAY_PICKER_CLASS_NAMES,
  selected: "bg-violet-500/20 rounded-lg text-violet-300",
  range_start: "bg-violet-500/40 rounded-lg text-white font-medium",
  range_end: "bg-violet-500/40 rounded-lg text-white font-medium",
  range_middle: "bg-violet-500/10 rounded-none text-white/70",
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