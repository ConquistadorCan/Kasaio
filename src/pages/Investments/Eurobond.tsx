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
import { PageHeader } from "../../components/ui/primitives";
import type { Asset, InvestmentTransaction } from "../../types/investments";

function currencySymbol(currency: string) {
  return currency === "USD" ? "$" : "₺";
}

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

  const popoverContentStyle = {
    zIndex: 70, background: "var(--bg-1)", border: "1px solid var(--line)",
    borderRadius: "var(--r-3)", boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)", padding: 12,
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </label>
      <PopoverPrimitive.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setView("day"); }}>
        <PopoverPrimitive.Trigger style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: "6px 10px", fontSize: 13, color: value ? "var(--fg)" : "var(--fg-5)", cursor: "pointer", outline: "none" }}>
          <span className={value ? "mono" : ""}>
            {value
              ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value + "T12:00:00"))
              : "Pick a date"}
          </span>
          <CalendarIcon size={14} style={{ color: "var(--fg-4)" }} />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content sideOffset={4} style={popoverContentStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <button onClick={() => shift(view === "day" ? "day" : "year", -1)} className="btn-icon" style={{ fontSize: 18 }}>‹</button>
              {view === "year" ? (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{`${year - 6} – ${year + 5}`}</span>
              ) : (
                <button
                  onClick={() => setView((v) => v === "day" ? "month" : "year")}
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--r-2)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
                >
                  {view === "day"
                    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(current)
                    : year}
                </button>
              )}
              <button onClick={() => shift(view === "day" ? "day" : "year", 1)} className="btn-icon" style={{ fontSize: 18 }}>›</button>
            </div>

            {view === "year" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", height: 192, width: 224 }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const y = year - 6 + i;
                  return (
                    <button key={y}
                      onClick={() => { const d = new Date(value ? value + "T12:00:00" : Date.now()); d.setFullYear(y); onChange(d.toISOString().split("T")[0]); setView("month"); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: year === y ? "var(--accent-bg)" : "none", color: year === y ? "var(--accent-2)" : "var(--fg-3)" }}
                    >{y}</button>
                  );
                })}
              </div>
            ) : view === "month" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", height: 192, width: 224 }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const lbl = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, i, 1));
                  return (
                    <button key={i}
                      onClick={() => { const d = new Date(value ? value + "T12:00:00" : Date.now()); d.setMonth(i); onChange(d.toISOString().split("T")[0]); setView("day"); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: current.getMonth() === i ? "var(--accent-bg)" : "none", color: current.getMonth() === i ? "var(--accent-2)" : "var(--fg-3)" }}
                    >{lbl}</button>
                  );
                })}
              </div>
            ) : (
              <>
                <DayPicker mode="single" month={current} hideNavigation selected={value ? new Date(value + "T12:00:00") : undefined}
                  onSelect={(day) => {
                    if (day) {
                      const local = new Date(day.getTime() - day.getTimezoneOffset() * 60000);
                      onChange(local.toISOString().split("T")[0]);
                      setOpen(false);
                    }
                  }}
                  classNames={DAY_PICKER_CLASS_NAMES}
                />
                <button onClick={() => onChange(new Date().toISOString().split("T")[0])} style={{ marginTop: 8, width: "100%", padding: "6px", borderRadius: "var(--r-2)", fontSize: 11.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer" }}>
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

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 400, background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--r-4)", padding: 20, boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Eurobond Details</h2>
        <p style={{ fontSize: 12, color: "var(--fg-4)", marginBottom: 16 }}>{asset.name} · {asset.symbol}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Face Value (USD per bond)</label>
            <input type="number" value={form.face_value} placeholder="1000" style={{ width: "100%" }}
              onChange={(e) => {
                const fv = e.target.value;
                setForm((p) => lastEdited === "rate"
                  ? { ...p, face_value: fv, coupon_price: calcPrice(p.coupon_rate, fv, p.coupon_frequency) }
                  : { ...p, face_value: fv, coupon_rate: calcRate(p.coupon_price, fv, p.coupon_frequency) }
                );
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Annual Coupon Rate (%)</label>
            <input type="number" value={form.coupon_rate} placeholder="6.5" step="0.01" style={{ width: "100%" }}
              onChange={(e) => {
                const rate = e.target.value;
                setLastEdited("rate");
                setForm((p) => ({ ...p, coupon_rate: rate, coupon_price: calcPrice(rate, p.face_value, p.coupon_frequency) }));
              }}
            />
          </div>
          <div style={{ textAlign: "center", color: "var(--fg-5)", fontSize: 12, userSelect: "none" }}>↕</div>
          <div>
            <label style={labelStyle}>Coupon Price (per bond per payment)</label>
            <input type="number" value={form.coupon_price} placeholder="e.g. 32.5" step="any" min="0" style={{ width: "100%" }}
              onChange={(e) => {
                const price = e.target.value;
                setLastEdited("price");
                setForm((p) => ({ ...p, coupon_price: price, coupon_rate: calcRate(price, p.face_value, p.coupon_frequency) }));
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Coupon Frequency (per year)</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ v: "1", label: "Annual" }, { v: "2", label: "Semi-annual" }].map(({ v, label }) => (
                <button
                  key={v}
                  onClick={() => setForm((p) => lastEdited === "rate"
                    ? { ...p, coupon_frequency: v, coupon_price: calcPrice(p.coupon_rate, p.face_value, v) }
                    : { ...p, coupon_frequency: v, coupon_rate: calcRate(p.coupon_price, p.face_value, v) }
                  )}
                  style={{
                    flex: 1, padding: "7px", borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 80ms",
                    border: "1px solid", background: form.coupon_frequency === v ? "var(--accent-bg)" : "var(--bg-1)",
                    color: form.coupon_frequency === v ? "var(--accent-2)" : "var(--fg-4)",
                    borderColor: form.coupon_frequency === v ? "var(--accent-line)" : "var(--line)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <DatePickerField label="First Coupon Date" value={form.first_coupon_date} onChange={(v) => setForm((p) => ({ ...p, first_coupon_date: v }))} />
          <DatePickerField label="Maturity Date" value={form.maturity_date} onChange={(v) => setForm((p) => ({ ...p, maturity_date: v }))} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} disabled={loading} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CouponEvent {
  asset: Asset;
  date: Date;
  amount: number;
  recorded: boolean;
  overdue: boolean;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CouponCalendar({ events, onRecord }: { events: CouponEvent[]; onRecord: (event: CouponEvent) => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [drillMonth, setDrillMonth] = useState<number | null>(null);
  const today = new Date();

  const legend = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--fg-4)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: "var(--success)" }} />Recorded</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: "var(--warning)" }} />Overdue</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: "var(--accent)" }} />Upcoming</span>
    </div>
  );

  if (drillMonth === null) {
    return (
      <div className="surface" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Coupon Calendar</p>
          {legend}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={() => setYear((y) => y - 1)} className="btn-icon" style={{ fontSize: 18 }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{year}</span>
          <button onClick={() => setYear((y) => y + 1)} className="btn-icon" style={{ fontSize: 18 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
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
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start", padding: 10,
                  borderRadius: "var(--r-2)", border: `1px solid ${monthEvts.length > 0 ? "var(--line)" : "var(--line-soft)"}`,
                  background: monthEvts.length > 0 ? "var(--bg-3)" : "var(--bg-1)",
                  cursor: "pointer", textAlign: "left", outline: isCurrentMonth ? "1px solid var(--accent-line)" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = monthEvts.length > 0 ? "var(--line)" : "var(--line-soft)")}
              >
                <span style={{ fontSize: 11, fontWeight: 500, marginBottom: 6, color: isCurrentMonth ? "var(--accent-2)" : "var(--fg-3)" }}>{name}</span>
                {totalAmount > 0 ? (
                  <>
                    <span className="num" style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>${formatCurrency(totalAmount)}</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                      {recordedEvts.length > 0 && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "var(--success-bg)", color: "var(--success)" }}>{recordedEvts.length} recorded</span>}
                      {overdueEvts.length > 0 && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "var(--warning-bg)", color: "var(--warning)" }}>{overdueEvts.length} due</span>}
                      {upcomingEvts.length > 0 && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: "var(--accent-bg)", color: "var(--accent-2)" }}>{upcomingEvts.length} upcoming</span>}
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--fg-5)" }}>—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

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
    <div className="surface" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Coupon Calendar</p>
        {legend}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button onClick={prevMonth} className="btn-icon" style={{ fontSize: 18 }}>‹</button>
        <button
          onClick={() => setDrillMonth(null)}
          style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--r-2)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
        >
          {monthLabel}
        </button>
        <button onClick={nextMonth} className="btn-icon" style={{ fontSize: 18 }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 500, color: "var(--fg-5)", padding: "3px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1 }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - startOffset + 1;
          const isCurrentMonth = day >= 1 && day <= daysInMonth;
          const isToday = isCurrentMonth && today.getFullYear() === year && today.getMonth() === drillMonth && today.getDate() === day;
          const dayEvents = isCurrentMonth ? eventsForDay(day) : [];
          return (
            <div
              key={i}
              style={{
                minHeight: 44, borderRadius: "var(--r-1)", padding: 3,
                display: "flex", flexDirection: "column",
                background: isCurrentMonth ? "var(--bg-1)" : "transparent",
                outline: isToday ? "1px solid var(--accent-line)" : "none",
                opacity: isCurrentMonth ? 1 : 0, pointerEvents: isCurrentMonth ? "auto" : "none",
              }}
            >
              <span className="mono" style={{ fontSize: 10, marginBottom: 2, color: isToday ? "var(--accent-2)" : "var(--fg-4)" }}>
                {isCurrentMonth ? day : ""}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {dayEvents.map((e, ei) => (
                  <button
                    key={ei}
                    onClick={() => !e.recorded && onRecord(e)}
                    title={`${e.asset.name}: $${formatCurrency(e.amount)}${e.recorded ? " (recorded)" : ""}`}
                    style={{
                      width: "100%", textAlign: "left", fontSize: 9, lineHeight: 1.3, padding: "1px 3px", borderRadius: 2,
                      border: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      cursor: e.recorded ? "default" : "pointer",
                      background: e.recorded ? "var(--success-bg)" : e.overdue ? "var(--warning-bg)" : "var(--accent-bg)",
                      color: e.recorded ? "var(--success)" : e.overdue ? "var(--warning)" : "var(--accent-2)",
                    }}
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
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line-soft)", paddingTop: 14 }}>
          <p style={{ fontSize: 10.5, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            {monthLabel} Coupons
          </p>
          {monthEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {e.recorded
                  ? <CheckCircle size={13} style={{ color: "var(--success)", flexShrink: 0 }} />
                  : e.overdue
                    ? <AlertCircle size={13} style={{ color: "var(--warning)", flexShrink: 0 }} />
                    : <Clock size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                <div>
                  <p style={{ fontSize: 13, color: "var(--fg)" }}>{e.asset.name}</p>
                  <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{formatShortDate(e.date)}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>${formatCurrency(e.amount)}</span>
                {!e.recorded && (
                  <button
                    onClick={() => onRecord(e)}
                    style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: "var(--r-1)", fontWeight: 500, border: "none", cursor: "pointer",
                      background: e.overdue ? "var(--warning-bg)" : "var(--accent-bg)",
                      color: e.overdue ? "var(--warning)" : "var(--accent-2)",
                    }}
                  >
                    Record
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HOLD_COLS = "1fr 60px 70px 110px 100px 130px 120px 32px";
const CLOSED_COLS = "1fr 80px 160px";

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
    const totalIncome = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const totalInvested = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "BUY").reduce((sum, t) => sum + t.quantity * t.price, 0);
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
    const totalIncome = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const realizedPnl = holding?.realized_pnl ?? 0;
    const extraPnl = totalIncome + realizedPnl;
    const pnl = currentValue !== null && costBasis !== null ? (currentValue - costBasis) + extraPnl : extraPnl !== 0 ? extraPnl : null;
    const pnlPct = pnl !== null && costBasis ? (pnl / costBasis) * 100 : null;
    const couponDates = getCouponDates(asset);
    const now = new Date();
    const nextCoupon = couponDates.find((d) => d >= now) ?? null;
    const overdueCount = couponDates.filter((d) => d < now && !isCouponRecorded(asset.id, d, investmentTransactions)).length;
    return { asset, holding, latestPrice, sym, currentValue, pnl, pnlPct, nextCoupon, overdueCount };
  });

  const couponEvents: CouponEvent[] = useMemo(() => {
    const events: CouponEvent[] = [];
    const now = new Date();
    for (const asset of eurobondAssets) {
      const holding = holdings.find((h) => h.asset_id === asset.id);
      if (!holding) continue;
      const dates = getCouponDates(asset);
      const amount = couponAmountPerPayment(asset, holding.quantity);
      for (const date of dates) {
        const recorded = isCouponRecorded(asset.id, date, investmentTransactions);
        events.push({ asset, date, amount, recorded, overdue: date < now && !recorded });
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

  async function handleAddTransaction(data: { asset_id: number; transaction_type: "BUY" | "SELL"; quantity: number; price: number; date: string }): Promise<string | undefined> {
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

  async function handleAddIncome(data: { asset_id: number; transaction_type: "INCOME"; quantity: number; price: number; date: string }): Promise<string | undefined> {
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
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingBottom: 24 }}>
      <PageHeader
        title="Eurobonds"
        meta={`${eurobondAssets.length} assets`}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Transaction
          </button>
        }
      />

      {/* Active holdings */}
      <div className="surface" style={{ overflow: "hidden" }}>
        <div className="table-head" style={{ gridTemplateColumns: HOLD_COLS }}>
          {["Asset", "CCY", "Qty", "Avg Cost", "Maturity", "Next Coupon", "P&L", ""].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No Eurobonds held</p>
          </div>
        ) : (
          rows.map(({ asset, holding, sym, pnl, pnlPct, nextCoupon, overdueCount }) => {
            const maturity = asset.maturity_date ? new Date(asset.maturity_date + "T12:00:00") : null;
            const daysToMaturity = maturity ? daysUntil(maturity) : null;
            const couponRate = asset.coupon_rate ? `${(Number(asset.coupon_rate) * 100).toFixed(2)}%` : "—";
            const nextCouponAmount = holding && asset.face_value && asset.coupon_rate && asset.coupon_frequency
              ? couponAmountPerPayment(asset, holding.quantity) : null;
            return (
              <div key={asset.id} className="table-row" style={{ gridTemplateColumns: HOLD_COLS }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{asset.name}</p>
                  <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{asset.symbol}</p>
                  {overdueCount > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 99, background: "var(--warning-bg)", color: "var(--warning)" }}>
                      <AlertCircle size={9} />{overdueCount} due
                    </span>
                  )}
                </div>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-4)" }}>{asset.currency}</span>
                <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{holding ? holding.quantity.toFixed(2) : "—"}</span>
                <div>
                  <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                    {holding ? `${sym}${formatCurrency(holding.average_cost)}` : "—"}
                  </span>
                  {asset.coupon_rate && (
                    <p style={{ fontSize: 10.5, color: "var(--fg-4)", marginTop: 1 }}>{couponRate} coupon</p>
                  )}
                </div>
                <div>
                  {maturity ? (
                    <>
                      <p className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                        {maturity.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      {daysToMaturity !== null && (
                        <p style={{ fontSize: 10.5, marginTop: 1, color: daysToMaturity < 90 ? "var(--warning)" : "var(--fg-4)" }}>
                          {daysToMaturity > 0 ? `${daysToMaturity}d` : "Matured"}
                        </p>
                      )}
                    </>
                  ) : <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>}
                </div>
                <div>
                  {nextCoupon ? (
                    <>
                      <p className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                        {nextCoupon.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                      {nextCouponAmount !== null && (
                        <p style={{ fontSize: 10.5, color: "var(--fg-4)", marginTop: 1 }}>${formatCurrency(nextCouponAmount)}</p>
                      )}
                    </>
                  ) : <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>}
                </div>
                <div>
                  {pnl !== null ? (
                    <>
                      <p className="num" style={{ fontSize: 13, fontWeight: 500, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                      </p>
                      <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: pnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
                        {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                      </p>
                    </>
                  ) : <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>}
                </div>
                <button onClick={() => setEditingAsset(asset)} className="btn-icon" title="Edit eurobond details">
                  <Pencil size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Closed positions */}
      {closedRows.length > 0 && (
        <div>
          <button
            onClick={() => setShowClosed((p) => !p)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ChevronDown size={14} style={{ transform: showClosed ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
            Closed Positions ({closedRows.length})
          </button>
          {showClosed && (
            <div className="surface" style={{ overflow: "hidden", marginTop: 8 }}>
              <div className="table-head" style={{ gridTemplateColumns: CLOSED_COLS }}>
                {["Asset", "CCY", "Realized P&L"].map((col) => <span key={col}>{col}</span>)}
              </div>
              {closedRows.map(({ asset, realizedPnl, realizedPnlPct }) => {
                const sym = currencySymbol(asset.currency);
                return (
                  <div key={asset.id} className="table-row" style={{ gridTemplateColumns: CLOSED_COLS }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}>{asset.name}</p>
                      <p style={{ fontSize: 11, color: "var(--fg-5)", marginTop: 1 }}>{asset.symbol}</p>
                    </div>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-4)" }}>{asset.currency}</span>
                    <div>
                      <p className="num" style={{ fontSize: 13, fontWeight: 500, color: realizedPnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                        {realizedPnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(realizedPnl))}
                      </p>
                      {realizedPnlPct !== null && (
                        <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: realizedPnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
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

      {/* Coupon calendar */}
      {hasCalendarData ? (
        <CouponCalendar events={couponEvents} onRecord={handleRecordCoupon} />
      ) : eurobondAssets.length > 0 && (
        <div className="surface" style={{ padding: 16, textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--fg-4)" }}>Set coupon details on your holdings using the <Pencil size={12} style={{ display: "inline" }} /> button to enable the coupon calendar.</p>
        </div>
      )}

      {showModal && (
        <TransactionModal mode="add" assets={allEurobondAssets} holdings={holdings} onSubmit={handleAddTransaction} onClose={() => setShowModal(false)} loading={mutating} />
      )}
      {showIncomeModal && (
        <IncomeTransactionModal onSubmit={handleAddIncome} onClose={() => { setShowIncomeModal(false); setPrefillIncome(null); }} loading={mutating}
          prefillAssetId={prefillIncome?.asset.id} prefillQuantity={prefillIncome?.quantity} prefillPricePerUnit={prefillIncome?.pricePerUnit} prefillDate={prefillIncome?.date}
        />
      )}
      {editingAsset && (
        <EurobondDetailsModal asset={editingAsset} onSave={handleSaveDetails} onClose={() => setEditingAsset(null)} loading={detailsLoading} />
      )}
    </div>
  );
}
