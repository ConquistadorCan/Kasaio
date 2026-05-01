import { useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { ChevronDown, CalendarIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Modal } from "../ui/primitives";
import { ErrorBanner } from "../ui/ErrorComponents";
import { EMPTY_FORM, DAY_PICKER_CLASS_NAMES, type TransactionFormData } from "./types";
import type { TransactionType } from "../../types";

interface TransactionModalProps {
  mode: "add" | "edit";
  initial?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => Promise<string | undefined>;
  onClose: () => void;
  loading: boolean;
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em",
};

export function TransactionModal({ mode, initial = EMPTY_FORM, onSubmit, onClose, loading }: TransactionModalProps) {
  const allCategories = useAppStore((s) => s.categories);
  const [form, setForm] = useState<TransactionFormData>(initial);
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});
  const [submitError, setSubmitError] = useState("");
  const [pickerView, setPickerView] = useState<"day" | "month" | "year">("day");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const currentPickerDate = form.date ? new Date(form.date + "T12:00:00") : new Date();
  const pickerYear = currentPickerDate.getFullYear();

  function validate(): boolean {
    const next: Partial<TransactionFormData> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = "Enter a valid amount";
    if (!form.date) next.date = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitError("");
    const err = await onSubmit(form);
    if (err) setSubmitError(err);
  }

  function field(key: keyof TransactionFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError("");
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={mode === "add" ? "Add Transaction" : "Edit Transaction"}
      size="sm"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Wallet */}
        <div>
          <label style={LABEL_STYLE}>Wallet</label>
          <div style={{ display: "flex", gap: 2, background: "var(--bg-1)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-2)", padding: 3 }}>
            {(["TRY", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => field("currency", c)}
                style={{
                  flex: 1, padding: "5px 12px", borderRadius: "var(--r-1)", fontSize: 12, fontWeight: 500,
                  border: "none", cursor: "pointer", transition: "all 80ms", fontFamily: "inherit",
                  background: form.currency === c ? "var(--bg-3)" : "transparent",
                  color: form.currency === c ? "var(--fg)" : "var(--fg-4)",
                }}
              >
                {c === "TRY" ? "₺ TRY" : "$ USD"}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={LABEL_STYLE}>Type</label>
          <div style={{ display: "flex", gap: 2, background: "var(--bg-1)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-2)", padding: 3 }}>
            {(["income", "expense"] as TransactionType[]).map((t) => {
              const active = form.type === t;
              const isIncome = t === "income";
              return (
                <button
                  key={t}
                  onClick={() => field("type", t)}
                  style={{
                    flex: 1, padding: "5px 12px", borderRadius: "var(--r-1)", fontSize: 12, fontWeight: 500,
                    border: "none", cursor: "pointer", transition: "all 80ms", fontFamily: "inherit",
                    textTransform: "capitalize",
                    background: active ? (isIncome ? "var(--success-bg)" : "var(--danger-bg)") : "transparent",
                    color: active ? (isIncome ? "var(--success)" : "var(--danger)") : "var(--fg-4)",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={LABEL_STYLE}>
            Description <span style={{ color: "var(--fg-5)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="e.g. Grocery shopping"
            style={{ width: "100%" }}
          />
        </div>

        {/* Amount */}
        <div>
          <label style={LABEL_STYLE}>Amount ({form.currency === "USD" ? "$" : "₺"})</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => field("amount", e.target.value)}
            placeholder="0.00"
            min="0"
            style={{ width: "100%", ...(errors.amount ? { borderColor: "var(--danger)" } : {}) }}
          />
          {errors.amount && <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 3 }}>{errors.amount}</p>}
        </div>

        {/* Category */}
        <div>
          <label style={LABEL_STYLE}>
            Category <span style={{ color: "var(--fg-5)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span>
          </label>
          <SelectPrimitive.Root value={form.category_id} onValueChange={(val) => field("category_id", val)}>
            <SelectPrimitive.Trigger
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "oklch(1 0 0 / 0.04)", border: "1px solid var(--line)", borderRadius: "var(--r-2)",
                padding: "6px 9px", fontSize: 12.5, color: "var(--fg)", outline: "none",
                cursor: "pointer", fontFamily: "inherit", transition: "border-color 80ms",
              }}
            >
              <SelectPrimitive.Value placeholder={<span style={{ color: "var(--fg-5)" }}>Uncategorized</span>} />
              <SelectPrimitive.Icon>
                <ChevronDown size={14} style={{ color: "var(--fg-4)" }} />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                position="popper"
                sideOffset={4}
                style={{
                  zIndex: 100, width: "var(--radix-select-trigger-width)",
                  background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-2)",
                  boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)", overflow: "hidden",
                }}
              >
                <SelectPrimitive.Viewport style={{ padding: 4 }}>
                  <SelectPrimitive.Item
                    value="none"
                    style={{ display: "flex", alignItems: "center", padding: "6px 10px", fontSize: 12.5, color: "var(--fg-4)", borderRadius: "var(--r-1)", cursor: "pointer", outline: "none", userSelect: "none" }}
                    onFocus={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                    onBlur={(e) => (e.currentTarget.style.background = "")}
                  >
                    <SelectPrimitive.ItemText>Uncategorized</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  {allCategories.length > 0 && <div style={{ margin: "2px 0", height: 1, background: "var(--line)" }} />}
                  {allCategories.map((c) => (
                    <SelectPrimitive.Item
                      key={c.id}
                      value={String(c.id)}
                      style={{ display: "flex", alignItems: "center", padding: "6px 10px", fontSize: 12.5, color: "var(--fg-2)", borderRadius: "var(--r-1)", cursor: "pointer", outline: "none", userSelect: "none" }}
                      onFocus={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                      onBlur={(e) => (e.currentTarget.style.background = "")}
                    >
                      <SelectPrimitive.ItemText>{c.name}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>

        {/* Date */}
        <div>
          <label style={LABEL_STYLE}>Date</label>
          <PopoverPrimitive.Root
            open={datePickerOpen}
            onOpenChange={(open) => { setDatePickerOpen(open); if (!open) setPickerView("day"); }}
          >
            <PopoverPrimitive.Trigger
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "oklch(1 0 0 / 0.04)",
                border: `1px solid ${errors.date ? "var(--danger)" : "var(--line)"}`,
                borderRadius: "var(--r-2)", padding: "6px 9px", fontSize: 12.5,
                color: errors.date ? "var(--danger)" : "var(--fg)", outline: "none",
                cursor: "pointer", fontFamily: "inherit", transition: "border-color 80ms",
              }}
            >
              <span style={{ color: form.date ? "var(--fg)" : "var(--fg-5)" }}>
                {form.date
                  ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(form.date + "T12:00:00"))
                  : "Pick a date"}
              </span>
              <CalendarIcon size={14} style={{ color: "var(--fg-4)" }} />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
              <PopoverPrimitive.Content
                sideOffset={4}
                style={{
                  zIndex: 100, background: "var(--bg-2)", border: "1px solid var(--line)",
                  borderRadius: "var(--r-3)", padding: 12,
                  boxShadow: "0 12px 40px oklch(0 0 0 / 0.4)",
                }}
              >
                {/* Nav header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <button
                    className="btn-icon"
                    onClick={() => {
                      const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                      if (pickerView === "day") d.setMonth(d.getMonth() - 1);
                      else d.setFullYear(d.getFullYear() - 1);
                      field("date", d.toISOString().split("T")[0]);
                    }}
                    style={{ fontSize: 18 }}
                  >
                    ‹
                  </button>
                  {pickerView === "year" ? (
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)", padding: "3px 8px" }}>
                      {`${pickerYear - 6} – ${pickerYear + 5}`}
                    </span>
                  ) : (
                    <button
                      onClick={() => setPickerView((v) => v === "day" ? "month" : "year")}
                      className="btn-ghost btn"
                      style={{ fontSize: 13, padding: "3px 8px", height: "auto" }}
                    >
                      {pickerView === "day"
                        ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentPickerDate)
                        : pickerYear}
                    </button>
                  )}
                  <button
                    className="btn-icon"
                    onClick={() => {
                      const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                      if (pickerView === "day") d.setMonth(d.getMonth() + 1);
                      else d.setFullYear(d.getFullYear() + 1);
                      field("date", d.toISOString().split("T")[0]);
                    }}
                    style={{ fontSize: 18 }}
                  >
                    ›
                  </button>
                </div>

                {pickerView === "year" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(4, 1fr)", height: 192, width: 224 }}>
                    {Array.from({ length: 12 }, (_, i) => {
                      const year = pickerYear - 6 + i;
                      const isSelected = pickerYear === year;
                      return (
                        <button
                          key={year}
                          onClick={() => {
                            const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                            d.setFullYear(year);
                            field("date", d.toISOString().split("T")[0]);
                            setPickerView("month");
                          }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500,
                            border: "none", cursor: "pointer", fontFamily: "inherit", transition: "80ms",
                            background: isSelected ? "var(--accent-bg)" : "transparent",
                            color: isSelected ? "var(--accent)" : "var(--fg-3)",
                          }}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                ) : pickerView === "month" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(4, 1fr)", height: 192, width: 224 }}>
                    {Array.from({ length: 12 }, (_, i) => {
                      const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, i, 1));
                      const isSelected = currentPickerDate.getMonth() === i;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                            d.setMonth(i);
                            field("date", d.toISOString().split("T")[0]);
                            setPickerView("day");
                          }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            borderRadius: "var(--r-2)", fontSize: 13, fontWeight: 500,
                            border: "none", cursor: "pointer", fontFamily: "inherit", transition: "80ms",
                            background: isSelected ? "var(--accent-bg)" : "transparent",
                            color: isSelected ? "var(--accent)" : "var(--fg-3)",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <DayPicker
                      mode="single"
                      month={currentPickerDate}
                      hideNavigation
                      selected={form.date ? new Date(form.date + "T12:00:00") : undefined}
                      onSelect={(day) => {
                        if (day) {
                          const local = new Date(day.getTime() - day.getTimezoneOffset() * 60000);
                          field("date", local.toISOString().split("T")[0]);
                          setDatePickerOpen(false);
                        }
                      }}
                      classNames={DAY_PICKER_CLASS_NAMES}
                    />
                    <button
                      onClick={() => field("date", new Date().toISOString().split("T")[0])}
                      style={{
                        marginTop: 6, width: "100%", padding: "5px 0", borderRadius: "var(--r-2)",
                        fontSize: 12, color: "var(--fg-5)", background: "none", border: "none",
                        cursor: "pointer", fontFamily: "inherit", transition: "80ms",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg-3)"; e.currentTarget.style.background = "var(--bg-3)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-5)"; e.currentTarget.style.background = "none"; }}
                    >
                      Today
                    </button>
                  </>
                )}
              </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
          </PopoverPrimitive.Root>
          {errors.date && <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 3 }}>{errors.date}</p>}
        </div>

        {submitError && <ErrorBanner message={submitError} />}
      </div>
    </Modal>
  );
}
