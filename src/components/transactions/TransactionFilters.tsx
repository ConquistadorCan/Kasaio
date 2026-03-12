import { cn } from "../../lib/utils";
import { DateRangePicker, type DateRange } from "./DateRangePicker";
import type { FilterType } from "./types";

interface TransactionFiltersProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
}

export function TransactionFilters({
  filter,
  onFilterChange,
  dateRange,
  onDateRangeChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
