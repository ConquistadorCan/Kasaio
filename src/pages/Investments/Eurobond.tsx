import { useState, useMemo } from "react";
import { Plus, ChevronDown, Pencil, CheckCircle, Clock, AlertCircle, CalendarIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { DAY_PICKER_CLASS_NAMES } from "../../components/transactions/types";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { assetsApi, EurobondDetailsUpdate } from "../../api/assets";
import { logError } from "../../lib/logger";
import { formatCurrency } from "../../lib/formatters";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { IncomeTransactionModal } from "../../components/investment/IncomeTransactionModal";
import { cn } from "../../lib/utils";
import type { Asset, InvestmentTransaction } from "../../types/investments";

function currencySymbol(currency: string) {
  return currency === "USD" ? "$" : "₺";
}

// ── Coupon helpers ────────────────────────────────────────────────────────────

function getCouponDates(asset: Asset): Date[] {
  if (!asset.first_coupon_date || !asset.coupon_frequency || !asset.maturity_date) return [];
  const dates: Date[] = [];
  const maturity = new Date(asset.maturity_date + "T12:00:00");
  let current = new Date(asset.first_coupon_date + "T12:00:00");
  const monthsPerPeriod = 12 / asset.coupon_frequency;
  while (current <= maturity) {
    dates.push(new Date(current));
    current = new Date(current);
    current.setMonth(current.getMonth() + monthsPerPeriod);
  }
  return dates;
}

function couponAmountPerPayment(asset: Asset, quantity: number): number {
  if (!asset.face_value || !asset.coupon_rate || !asset.coupon_frequency) return 0;
  return quantity * Number(asset.face_value) * Number(asset.coupon_rate) / asset.coupon_frequency;
}

function isCouponRecorded(assetId: number, date: Date, txns: InvestmentTransaction[]): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return txns.some(
    (t) => t.asset_id === assetId && t.transaction_type === "INCOME" && t.date.startsWith(dateStr)
  );
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Reusable date picker field ────────────────────────────────────────────────

function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"day" | "month" | "year">("day");
  const current = value ? new Date(value + "T12:00:00") : new Date();
  const year = current.getFullYear();

  function shift(type: "day" | "year", dir: number) {
    const d = new Date(value ? value + "T12:00:00" : Date.now());
    if (type === "day") d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    onChange(d.toISOString().split("T")[0]);
  }

  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      <PopoverPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setView("day"); }}>
        <PopoverPrimitive.Trigger className="w-full flex items-center justify-between bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm outline-none transition-colors text-white hover:border-white/20">
          <span className={value ? "text-white font-mono" : "text-white/20"}>
            {value
              ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T12:00:00"))
              : "Pick a date"}
          </span>
          <CalendarIcon size={14} className="text-white/30" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content sideOffset={4} className="z-50 bg-[#141422] border border-white/10 rounded-xl shadow-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => shift(view === "day" ? "day" : "year", -1)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
              >‹</button>
              {view === "year" ? (
                <span className="text-sm font-medium text-white px-2 py-1">{`${year - 6} – ${year + 5}`}</span>
              ) : (
                <button
                  onClick={() => setView((v) => v === "day" ? "month" : "year")}
                  className="text-sm font-medium text-white hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
                >
                  {view === "day"
                    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(current)
                    : year}
                </button>
              )}
              <button
                onClick={() => shift(view === "day" ? "day" : "year", 1)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
              >›</button>
            </div>

            {view === "year" ? (
              <div className="grid grid-cols-3 grid-rows-4 h-[192px] w-[224px]">
                {Array.from({ length: 12 }, (_, i) => {
                  const y = year - 6 + i;
                  return (
                    <button key={y} onClick={() => { const d = new Date(value ? value + "T12:00:00" : Date.now()); d.setFullYear(y); onChange(d.toISOString().split("T")[0]); setView("month"); }}
                      className={cn("flex items-center justify-center rounded-lg text-sm font-medium transition-colors", year === y ? "bg-violet-500/30 text-violet-300" : "text-white/60 hover:bg-white/5 hover:text-white")}>
                      {y}
                    </button>
                  );
                })}
              </div>
            ) : view === "month" ? (
              <div className="grid grid-cols-3 grid-rows-4 h-[192px] w-[224px]">
                {Array.from({ length: 12 }, (_, i) => {
                  const lbl = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, i, 1));
                  return (
                    <button key={i} onClick={() => { const d = new Date(value ? value + "T12:00:00" : Date.now()); d.setMonth(i); onChange(d.toISOString().split("T")[0]); setView("day"); }}
                      className={cn("flex items-center justify-center rounded-lg text-sm font-medium transition-colors", current.getMonth() === i ? "bg-violet-500/30 text-violet-300" : "text-white/60 hover:bg-white/5 hover:text-white")}>
                      {lbl}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <DayPicker
                  mode="single"
                  month={current}
                  hideNavigation
                  selected={value ? new Date(value + "T12:00:00") : undefined}
                  onSelect={(day) => {
                    if (day) {
                      const local = new Date(day.getTime() - day.getTimezoneOffset() * 60000);
                      onChange(local.toISOString().split("T")[0]);
                      setOpen(false);
                    }
                  }}
                  classNames={DAY_PICKER_CLASS_NAMES}
                />
                <button
                  onClick={() => onChange(new Date().toISOString().split("T")[0])}
                  className="mt-2 w-full py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  Today
                </button>
              </>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

// ── Eurobond details modal ────────────────────────────────────────────────────

interface DetailsModalProps {
  asset: Asset;
  onSave: (data: EurobondDetailsUpdate) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function EurobondDetailsModal({ asset, onSave, onClose, loading }: DetailsModalProps) {
  const [form, setForm] = useState({
    maturity_date: asset.maturity_date ?? "",
    coupon_rate: asset.coupon_rate != null ? String(parseFloat((asset.coupon_rate * 100).toPrecision(10))) : "",
    coupon_frequency: asset.coupon_frequency != null ? String(asset.coupon_frequency) : "2",
    first_coupon_date: asset.first_coupon_date ?? "",
    face_value: asset.face_value != null ? String(asset.face_value) : "1000",
    coupon_price: (() => {
      const r = asset.coupon_rate, fv = asset.face_value, freq = asset.coupon_frequency;
      if (r != null && fv != null && freq) return String(parseFloat(((fv * r) / freq).toPrecision(10)));
      return "";
    })(),
  });
  const [lastEdited, setLastEdited] = useState<"rate" | "price">("rate");

  function fp(n: number): string { return String(parseFloat(n.toPrecision(10))); }

  function calcPrice(rate: string, fv: string, freq: string): string {
    const r = parseFloat(rate), f = parseFloat(fv), q = parseFloat(freq);
    if (!r || !f || !q) return "";
    return fp((f * r) / 100 / q);
  }

  function calcRate(price: string, fv: string, freq: string): string {
    const p = parseFloat(price), f = parseFloat(fv), q = parseFloat(freq);
    if (!p || !f || !q) return "";
    return fp((p * q) / f * 100);
  }

  async function handleSave() {
    await onSave({
      maturity_date: form.maturity_date || null,
      coupon_rate: form.coupon_rate ? parseFloat((Number(form.coupon_rate) / 100).toPrecision(10)) : null,
      coupon_frequency: form.coupon_frequency ? Number(form.coupon_frequency) : null,
      first_coupon_date: form.first_coupon_date || null,
      face_value: form.face_value ? Number(form.face_value) : null,
    });
  }

  const inputCls = "w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors font-mono";
  const labelCls = "block text-xs font-medium text-white/50 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-1">Eurobond Details</h2>
        <p className="text-xs text-white/30 mb-5">{asset.name} · {asset.symbol}</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Face Value (USD per bond)</label>
            <input
              type="number" value={form.face_value} placeholder="1000"
              onChange={(e) => {
                const fv = e.target.value;
                setForm((p) => lastEdited === "rate"
                  ? { ...p, face_value: fv, coupon_price: calcPrice(p.coupon_rate, fv, p.coupon_frequency) }
                  : { ...p, face_value: fv, coupon_rate: calcRate(p.coupon_price, fv, p.coupon_frequency) }
                );
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Annual Coupon Rate (%)</label>
            <input
              type="number" value={form.coupon_rate} placeholder="6.5" step="0.01"
              onChange={(e) => {
                const rate = e.target.value;
                setLastEdited("rate");
                setForm((p) => ({ ...p, coupon_rate: rate, coupon_price: calcPrice(rate, p.face_value, p.coupon_frequency) }));
              }}
              className={inputCls}
            />
          </div>
          <div className="flex justify-center text-white/20 text-xs select-none -my-1">↕</div>
          <div>
            <label className={labelCls}>Coupon Price (per bond per payment)</label>
            <input
              type="number" value={form.coupon_price} placeholder="e.g. 32.5" step="any" min="0"
              onChange={(e) => {
                const price = e.target.value;
                setLastEdited("price");
                setForm((p) => ({ ...p, coupon_price: price, coupon_rate: calcRate(price, p.face_value, p.coupon_frequency) }));
              }}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Coupon Frequency (per year)</label>
            <div className="flex gap-2">
              {[{ v: "1", label: "Annual" }, { v: "2", label: "Semi-annual" }].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setForm((p) => lastEdited === "rate"
                    ? { ...p, coupon_frequency: v, coupon_price: calcPrice(p.coupon_rate, p.face_value, v) }
                    : { ...p, coupon_frequency: v, coupon_rate: calcRate(p.coupon_price, p.face_value, v) }
                  )}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors border",
                    form.coupon_frequency === v
                      ? "bg-violet-500/15 text-violet-400 border-violet-500/25"
                      : "bg-white/5 text-white/40 border-white/5 hover:bg-white/[0.08]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <DatePickerField
            label="First Coupon Date"
            value={form.first_coupon_date}
            onChange={(v) => setForm((p) => ({ ...p, first_coupon_date: v }))}
          />
          <DatePickerField
            label="Maturity Date"
            value={form.maturity_date}
            onChange={(v) => setForm((p) => ({ ...p, maturity_date: v }))}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

interface CouponEvent {
  asset: Asset;
  date: Date;
  amount: number;
  recorded: boolean;
  overdue: boolean;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CouponCalendar({
  events,
  onRecord,
}: {
  events: CouponEvent[];
  onRecord: (event: CouponEvent) => void;
}) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [drillMonth, setDrillMonth] = useState<number | null>(null); // null = year view

  const today = new Date();

  const legend = (
    <div className="flex items-center gap-3 text-xs text-white/30">
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Recorded</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Overdue</span>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />Upcoming</span>
    </div>
  );

  // ── Year view ──────────────────────────────────────────────────────────────
  if (drillMonth === null) {
    return (
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Coupon Calendar</p>
          {legend}
        </div>

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setYear((y) => y - 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xl">‹</button>
          <span className="text-sm font-medium text-white">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xl">›</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTH_NAMES.map((name, i) => {
            const monthEvts = events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === i);
            const totalAmount = monthEvts.reduce((s, e) => s + e.amount, 0);
            const recordedEvts = monthEvts.filter((e) => e.recorded);
            const overdueEvts = monthEvts.filter((e) => e.overdue);
            const upcomingEvts = monthEvts.filter((e) => !e.recorded && !e.overdue);
            const isCurrentMonth = today.getFullYear() === year && today.getMonth() === i;

            return (
              <button
                key={i}
                onClick={() => setDrillMonth(i)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border transition-colors text-left hover:bg-white/[0.05]",
                  monthEvts.length > 0 ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5",
                  isCurrentMonth && "ring-1 ring-violet-500/40"
                )}
              >
                <span className={cn("text-xs font-medium mb-2", isCurrentMonth ? "text-violet-400" : "text-white/50")}>
                  {name}
                </span>
                {totalAmount > 0 ? (
                  <>
                    <span className="text-sm font-mono font-medium text-white">${formatCurrency(totalAmount)}</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {recordedEvts.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                          {recordedEvts.length} recorded
                        </span>
                      )}
                      {overdueEvts.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                          {overdueEvts.length} due
                        </span>
                      )}
                      {upcomingEvts.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                          {upcomingEvts.length} upcoming
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-white/15">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Month/day view ─────────────────────────────────────────────────────────
  const monthLabel = `${MONTH_NAMES[drillMonth]} ${year}`;
  const firstDay = new Date(year, drillMonth, 1).getDay();
  const daysInMonth = new Date(year, drillMonth + 1, 0).getDate();
  const startOffset = (firstDay === 0 ? 7 : firstDay) - 1;
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const monthEvents = events.filter((e) => e.date.getFullYear() === year && e.date.getMonth() === drillMonth);

  function eventsForDay(day: number): CouponEvent[] {
    return monthEvents.filter((e) => e.date.getDate() === day);
  }

  function prevMonth() {
    if (drillMonth === 0) { setYear((y) => y - 1); setDrillMonth(11); }
    else setDrillMonth((m) => m! - 1);
  }
  function nextMonth() {
    if (drillMonth === 11) { setYear((y) => y + 1); setDrillMonth(0); }
    else setDrillMonth((m) => m! + 1);
  }

  return (
    <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Coupon Calendar</p>
        {legend}
      </div>

      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xl">‹</button>
        <button
          onClick={() => setDrillMonth(null)}
          className="text-sm font-medium text-white hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
        >
          {monthLabel}
        </button>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xl">›</button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-white/20 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - startOffset + 1;
          const isCurrentMonth = day >= 1 && day <= daysInMonth;
          const isToday = isCurrentMonth &&
            today.getFullYear() === year &&
            today.getMonth() === drillMonth &&
            today.getDate() === day;
          const dayEvents = isCurrentMonth ? eventsForDay(day) : [];

          return (
            <div
              key={i}
              className={cn(
                "min-h-[48px] rounded-md p-1 flex flex-col",
                isCurrentMonth ? "bg-white/[0.02]" : "opacity-0 pointer-events-none",
                isToday && "ring-1 ring-violet-500/40"
              )}
            >
              <span className={cn("text-[11px] font-mono mb-0.5", isToday ? "text-violet-400" : "text-white/30")}>
                {isCurrentMonth ? day : ""}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayEvents.map((e, ei) => (
                  <button
                    key={ei}
                    onClick={() => !e.recorded && onRecord(e)}
                    title={`${e.asset.name}: $${formatCurrency(e.amount)}${e.recorded ? " (recorded)" : ""}`}
                    className={cn(
                      "w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate transition-colors",
                      e.recorded
                        ? "bg-emerald-500/15 text-emerald-400 cursor-default"
                        : e.overdue
                          ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 cursor-pointer"
                          : "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 cursor-pointer"
                    )}
                  >
                    {e.asset.symbol}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {monthEvents.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-4 flex flex-col gap-2">
          <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-1">
            {monthLabel} Coupons
          </p>
          {monthEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map((e, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {e.recorded
                  ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                  : e.overdue
                    ? <AlertCircle size={13} className="text-amber-400 shrink-0" />
                    : <Clock size={13} className="text-violet-400 shrink-0" />}
                <div>
                  <p className="text-sm text-white">{e.asset.name}</p>
                  <p className="text-xs text-white/30">{formatShortDate(e.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white/70">${formatCurrency(e.amount)}</span>
                {!e.recorded && (
                  <button
                    onClick={() => onRecord(e)}
                    className={cn(
                      "text-xs px-2 py-1 rounded-md font-medium transition-colors",
                      e.overdue
                        ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                        : "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                    )}
                  >
                    Record
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {monthEvents.length === 0 && (
        <p className="text-xs text-white/20 text-center mt-4">No coupon payments this month</p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Eurobond() {
  const { assets, holdings, latestPrices, investmentTransactions, addInvestmentTransaction, refreshHolding, refreshAsset } = useInvestmentStore();
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [prefillIncome, setPrefillIncome] = useState<{ asset: Asset; quantity: number; pricePerUnit: number; date: string } | null>(null);

  const allEurobondAssets = assets.filter((a) => a.asset_type === "EUROBOND");
  const eurobondAssets = allEurobondAssets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity > 0));
  const closedEurobondAssets = allEurobondAssets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity === 0));

  const closedRows = closedEurobondAssets.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const totalIncome = investmentTransactions
      .filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME")
      .reduce((sum, t) => sum + t.quantity * t.price, 0);
    const totalInvested = investmentTransactions
      .filter((t) => t.asset_id === asset.id && t.transaction_type === "BUY")
      .reduce((sum, t) => sum + t.quantity * t.price, 0);
    const realizedPnl = (holding?.realized_pnl ?? 0) + totalIncome;
    const realizedPnlPct = totalInvested > 0 ? (realizedPnl / totalInvested) * 100 : null;
    return { asset, realizedPnl, realizedPnlPct };
  });

  const rows = eurobondAssets.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const latestPrice = latestPrices[asset.id]?.price ?? null;
    const sym = currencySymbol(asset.currency);
    const currentValue = latestPrice !== null && holding ? latestPrice * holding.quantity : null;
    const costBasis = holding ? holding.average_cost * holding.quantity : null;
    const totalIncome = investmentTransactions
      .filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME")
      .reduce((sum, t) => sum + t.quantity * t.price, 0);
    const realizedPnl = holding?.realized_pnl ?? 0;
    const extraPnl = totalIncome + realizedPnl;
    const pnl = currentValue !== null && costBasis !== null
      ? (currentValue - costBasis) + extraPnl
      : extraPnl !== 0 ? extraPnl : null;
    const pnlPct = pnl !== null && costBasis ? (pnl / costBasis) * 100 : null;

    // Coupon info
    const couponDates = getCouponDates(asset);
    const today = new Date();
    const nextCoupon = couponDates.find((d) => d >= today) ?? null;
    const overdueCount = couponDates.filter(
      (d) => d < today && !isCouponRecorded(asset.id, d, investmentTransactions)
    ).length;

    return { asset, holding, latestPrice, sym, currentValue, pnl, pnlPct, nextCoupon, overdueCount };
  });

  // All coupon events for all active holdings (for calendar)
  const couponEvents: CouponEvent[] = useMemo(() => {
    const events: CouponEvent[] = [];
    const today = new Date();
    for (const asset of eurobondAssets) {
      const holding = holdings.find((h) => h.asset_id === asset.id);
      if (!holding) continue;
      const dates = getCouponDates(asset);
      const amount = couponAmountPerPayment(asset, holding.quantity);
      for (const date of dates) {
        const recorded = isCouponRecorded(asset.id, date, investmentTransactions);
        events.push({ asset, date, amount, recorded, overdue: date < today && !recorded });
      }
    }
    return events;
  }, [eurobondAssets, holdings, investmentTransactions]);

  function handleRecordCoupon(event: CouponEvent) {
    const holding = holdings.find((h) => h.asset_id === event.asset.id);
    if (!holding) return;
    const pricePerUnit = event.asset.face_value && event.asset.coupon_rate && event.asset.coupon_frequency
      ? Number(event.asset.face_value) * Number(event.asset.coupon_rate) / event.asset.coupon_frequency
      : 0;
    setPrefillIncome({ asset: event.asset, quantity: holding.quantity, pricePerUnit, date: event.date.toISOString().split("T")[0] });
    setShowIncomeModal(true);
  }

  async function handleAddTransaction(data: {
    asset_id: number;
    transaction_type: "BUY" | "SELL";
    quantity: number;
    price: number;
    date: string;
  }): Promise<string | undefined> {
    setMutating(true);
    try {
      const txn = await investmentTransactionsApi.create({ ...data, date: new Date(data.date).toISOString() });
      addInvestmentTransaction(txn);
      const updatedHolding = await holdingsApi.get(data.asset_id);
      refreshHolding(updatedHolding);
      setShowModal(false);
    } catch (err) {
      await logError("Failed to add investment transaction", err);
      return "Failed to add transaction. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleAddIncome(data: {
    asset_id: number;
    transaction_type: "INCOME";
    quantity: number;
    price: number;
    date: string;
  }): Promise<string | undefined> {
    setMutating(true);
    try {
      const txn = await investmentTransactionsApi.create({ ...data, date: new Date(data.date).toISOString() });
      addInvestmentTransaction(txn);
      setShowIncomeModal(false);
      setPrefillIncome(null);
    } catch (err) {
      await logError("Failed to record coupon income", err);
      return "Failed to record income. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleSaveDetails(data: EurobondDetailsUpdate) {
    if (!editingAsset) return;
    setDetailsLoading(true);
    try {
      const updated = await assetsApi.updateEurobondDetails(editingAsset.id, data);
      refreshAsset(updated);
      setEditingAsset(null);
    } catch (err) {
      await logError("Failed to update eurobond details", err);
    } finally {
      setDetailsLoading(false);
    }
  }

  const hasCalendarData = eurobondAssets.some((a) => a.first_coupon_date && a.maturity_date);

  return (
    <div className="flex flex-col h-full gap-5 overflow-y-auto pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-white">Eurobonds</h1>
          <p className="text-sm text-white/40 mt-0.5">{eurobondAssets.length} assets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Transaction
        </button>
      </div>

      {/* ── Active holdings table ── */}
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col shrink-0">
        <div className="grid grid-cols-[1fr_60px_70px_110px_100px_130px_120px_32px] px-5 py-3 border-b border-white/5">
          {["Asset", "CCY", "Qty", "Avg Cost", "Maturity", "Next Coupon", "P&L", ""].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-white/20">No Eurobonds held</p>
          </div>
        ) : (
          rows.map(({ asset, holding, sym, pnl, pnlPct, nextCoupon, overdueCount }) => {
            const maturity = asset.maturity_date ? new Date(asset.maturity_date + "T12:00:00") : null;
            const daysToMaturity = maturity ? daysUntil(maturity) : null;
            const couponRate = asset.coupon_rate ? `${(Number(asset.coupon_rate) * 100).toFixed(2)}%` : "—";
            const nextCouponAmount = holding && asset.face_value && asset.coupon_rate && asset.coupon_frequency
              ? couponAmountPerPayment(asset, holding.quantity)
              : null;

            return (
              <div
                key={asset.id}
                className="grid grid-cols-[1fr_60px_70px_110px_100px_130px_120px_32px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{asset.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{asset.symbol}</p>
                  {overdueCount > 0 && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
                      <AlertCircle size={10} />{overdueCount} due
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/40 font-mono">{asset.currency}</span>
                <span className="text-sm text-white/70 font-mono">{holding ? holding.quantity.toFixed(2) : "—"}</span>
                <div>
                  <span className="text-sm text-white/70 font-mono">
                    {holding ? `${sym}${formatCurrency(holding.average_cost)}` : "—"}
                  </span>
                  {asset.coupon_rate && (
                    <p className="text-xs text-white/30 mt-0.5">{couponRate} coupon</p>
                  )}
                </div>
                <div>
                  {maturity ? (
                    <>
                      <p className="text-sm text-white/70 font-mono">
                        {maturity.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      {daysToMaturity !== null && (
                        <p className={cn("text-xs mt-0.5", daysToMaturity < 90 ? "text-amber-400/70" : "text-white/30")}>
                          {daysToMaturity > 0 ? `${daysToMaturity}d` : "Matured"}
                        </p>
                      )}
                    </>
                  ) : <span className="text-sm text-white/20">—</span>}
                </div>
                <div>
                  {nextCoupon ? (
                    <>
                      <p className="text-sm text-white/70 font-mono">
                        {nextCoupon.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      {nextCouponAmount !== null && (
                        <p className="text-xs text-white/30 mt-0.5">${formatCurrency(nextCouponAmount)}</p>
                      )}
                    </>
                  ) : <span className="text-sm text-white/20">—</span>}
                </div>
                <div>
                  {pnl !== null ? (
                    <>
                      <p className={cn("text-sm font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                      </p>
                      <p className={cn("text-xs font-mono mt-0.5", pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                        {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-white/20">—</span>
                  )}
                </div>
                <button
                  onClick={() => setEditingAsset(asset)}
                  className="flex items-center justify-center w-7 h-7 rounded-md text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
                  title="Edit eurobond details"
                >
                  <Pencil size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* ── Closed positions ── */}
      {closedRows.length > 0 && (
        <div className="shrink-0">
          <button
            onClick={() => setShowClosed((p) => !p)}
            className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors"
          >
            <ChevronDown size={14} className={cn("transition-transform", showClosed && "rotate-180")} />
            Closed Positions ({closedRows.length})
          </button>
          {showClosed && (
            <div className="mt-2 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_160px] px-5 py-3 border-b border-white/5">
                {["Asset", "CCY", "Realized P&L"].map((col) => (
                  <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
                ))}
              </div>
              {closedRows.map(({ asset, realizedPnl, realizedPnlPct }) => {
                const sym = currencySymbol(asset.currency);
                return (
                  <div key={asset.id} className="grid grid-cols-[1fr_80px_160px] px-5 py-4 border-b border-white/5 last:border-0 items-center">
                    <div>
                      <p className="text-sm font-medium text-white/50">{asset.name}</p>
                      <p className="text-xs text-white/20 mt-0.5">{asset.symbol}</p>
                    </div>
                    <span className="text-xs text-white/30 font-mono">{asset.currency}</span>
                    <div>
                      <p className={cn("text-sm font-mono font-medium", realizedPnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {realizedPnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(realizedPnl))}
                      </p>
                      {realizedPnlPct !== null && (
                        <p className={cn("text-xs font-mono mt-0.5", realizedPnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                          {realizedPnl >= 0 ? "+" : ""}{realizedPnlPct.toFixed(2)}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Coupon calendar ── */}
      {hasCalendarData ? (
        <CouponCalendar events={couponEvents} onRecord={handleRecordCoupon} />
      ) : eurobondAssets.length > 0 && (
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5 text-center shrink-0">
          <p className="text-sm text-white/30">Set coupon details on your holdings using the <Pencil size={12} className="inline" /> button to enable the coupon calendar.</p>
        </div>
      )}

      {/* ── Modals ── */}
      {showModal && (
        <TransactionModal
          mode="add"
          assets={allEurobondAssets}
          holdings={holdings}
          onSubmit={handleAddTransaction}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}

      {showIncomeModal && (
        <IncomeTransactionModal
          onSubmit={handleAddIncome}
          onClose={() => { setShowIncomeModal(false); setPrefillIncome(null); }}
          loading={mutating}
          prefillAssetId={prefillIncome?.asset.id}
          prefillQuantity={prefillIncome?.quantity}
          prefillPricePerUnit={prefillIncome?.pricePerUnit}
          prefillDate={prefillIncome?.date}
        />
      )}

      {editingAsset && (
        <EurobondDetailsModal
          asset={editingAsset}
          onSave={handleSaveDetails}
          onClose={() => setEditingAsset(null)}
          loading={detailsLoading}
        />
      )}
    </div>
  );
}
