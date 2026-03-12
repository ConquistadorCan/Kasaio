import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";

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
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
          value
            ? "bg-violet-500/15 border-violet-500/30 text-violet-300"
            : "bg-white/5 border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08]",
        )}
      >
        <CalendarIcon size={13} />
        {label}
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={6}
          align="start"
          className="z-50 bg-[#141422] border border-white/10 rounded-xl shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() - 1);
                  return d;
                })
              }
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
            >
              ‹
            </button>
            <button
              onClick={handleMonthClick}
              className="text-sm font-medium text-white hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
              title="Click to select entire month"
            >
              {new Intl.DateTimeFormat("en-US", {
                month: "long",
                year: "numeric",
              }).format(month)}
            </button>
            <button
              onClick={() =>
                setMonth((m) => {
                  const d = new Date(m);
                  d.setMonth(d.getMonth() + 1);
                  return d;
                })
              }
              className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
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
            classNames={{
              root: "text-white/80 text-sm",
              months: "flex flex-col",
              month: "space-y-3",
              month_caption: "hidden",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "w-8 h-8 flex items-center justify-center text-[11px] text-white/20 font-medium",
              weeks: "flex flex-col gap-0.5",
              week: "flex",
              day: "w-8 h-8 flex items-center justify-center",
              day_button:
                "w-8 h-8 flex items-center justify-center rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors outline-none",
              selected: "bg-violet-500/20 rounded-lg text-violet-300",
              range_start: "bg-violet-500/40 rounded-lg text-white font-medium",
              range_end: "bg-violet-500/40 rounded-lg text-white font-medium",
              range_middle: "bg-violet-500/10 rounded-none text-white/70",
              today: "bg-red-500/20 rounded-lg text-red-400 font-medium",
              outside: "opacity-20",
              disabled: "opacity-20 cursor-not-allowed",
            }}
          />

          {value && (
            <button
              onClick={() => onChange(null)}
              className="mt-2 w-full py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
            >
              Clear filter
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
