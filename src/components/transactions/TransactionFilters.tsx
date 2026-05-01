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
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        display: "flex", gap: 2,
        background: "var(--bg-1)", border: "1px solid var(--line-soft)",
        borderRadius: "var(--r-2)", padding: 3,
      }}>
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--r-1)",
              fontSize: 12,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "all 80ms",
              textTransform: "capitalize",
              background: filter === f ? "var(--bg-3)" : "transparent",
              color: filter === f ? "var(--fg)" : "var(--fg-4)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
