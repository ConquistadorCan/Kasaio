import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { DAY_PICKER_RANGE_CLASS_NAMES } from "./types";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}

function fmtDay(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [month, setMonth] = useState(new Date());

  function handleMonthClick() {
    const year = month.getFullYear();
    const m = month.getMonth();
    const monthStart = new Date(year, m, 1);
    const monthEnd = new Date(year, m + 1, 0);

    if (!value) {
      onChange({ from: fmtDay(monthStart), to: fmtDay(monthEnd) });
    } else {
      const existingFrom = new Date(value.from + "T12:00:00");
      const existingTo = new Date(value.to + "T12:00:00");
      const newFrom = monthStart < existingFrom ? monthStart : existingFrom;
      const newTo = monthEnd > existingTo ? monthEnd : existingTo;
      const isSame =
        fmtDay(newFrom) === value.from && fmtDay(newTo) === value.to;
      onChange(isSame ? null : { from: fmtDay(newFrom), to: fmtDay(newTo) });
    }
  }

  const label = value
    ? `${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value.from + "T12:00:00"))} → ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value.to + "T12:00:00"))}`
    : "Date range";

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: "var(--r-2)",
          fontSize: 12, fontWeight: 500, cursor: "pointer",
          border: "1px solid", transition: "all 80ms", fontFamily: "inherit",
          background: value ? "var(--accent-bg)" : "transparent",
          color: value ? "var(--accent)" : "var(--fg-4)",
          borderColor: value ? "var(--accent-line)" : "var(--line)",
        }}
      >
        <CalendarIcon size={13} />
        {label}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          style={{
            zIndex: 50, background: "var(--bg-2)", border: "1px solid var(--line)",
            borderRadius: "var(--r-3)", padding: 12,
            boxShadow: "0 12px 40px oklch(0 0 0 / 0.4)",
          }}
        >
          {/* Month navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              className="btn-icon"
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() - 1);
                  return d;
                })
              }
              style={{ fontSize: 18 }}
            >
              ‹
            </button>
            <button
              onClick={handleMonthClick}
              className="btn btn-ghost"
              style={{ fontSize: 13, padding: "3px 8px", height: "auto" }}
              title="Click to select entire month"
            >
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(month)}
            </button>
            <button
              className="btn-icon"
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() + 1);
                  return d;
                })
              }
              style={{ fontSize: 18 }}
            >
              ›
            </button>
          </div>

          <DayPicker
            mode="range"
            month={month}
            hideNavigation
            selected={
              value
                ? {
                    from: new Date(value.from + "T12:00:00"),
                    to: new Date(value.to + "T12:00:00"),
                  }
                : undefined
            }
            onSelect={(range) => {
              if (!range) {
                onChange(null);
                return;
              }
              const from = range.from ? fmtDay(range.from) : null;
              const to = range.to ? fmtDay(range.to) : from;
              if (from && to) onChange({ from, to });
            }}
            classNames={DAY_PICKER_RANGE_CLASS_NAMES}
          />

          {value && (
            <button
              onClick={() => onChange(null)}
              style={{
                marginTop: 6, width: "100%", padding: "5px 0", borderRadius: "var(--r-2)",
                fontSize: 12, color: "var(--fg-4)", background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit", transition: "80ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.background = "var(--bg-3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-4)"; e.currentTarget.style.background = "none"; }}
            >
              Clear filter
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
