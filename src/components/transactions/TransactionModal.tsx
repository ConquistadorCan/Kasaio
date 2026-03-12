import { useState } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { ChevronDown, CalendarIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/utils";
import { ErrorBanner } from "../ui/ErrorComponents";
import {
  EMPTY_FORM,
  DAY_PICKER_CLASS_NAMES,
  type TransactionFormData,
} from "./types";
import type { TransactionType } from "../../types";

interface TransactionModalProps {
  initial?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => Promise<string | undefined>;
  onClose: () => void;
  loading: boolean;
}

export function TransactionModal({
  initial = EMPTY_FORM,
  onSubmit,
  onClose,
  loading,
}: TransactionModalProps) {
  const categories = useAppStore((s) => s.categories);
  const [form, setForm] = useState<TransactionFormData>(initial);
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});
  const [submitError, setSubmitError] = useState("");

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-5">
          {initial === EMPTY_FORM ? "Add Transaction" : "Edit Transaction"}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {(["income", "expense"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => field("type", t)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    form.type === t
                      ? t === "income"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-red-500/15 text-red-400 border border-red-500/25"
                      : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/[0.08]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Description <span className="text-white/25">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              placeholder="e.g. Grocery shopping"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Amount (₺)
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => field("amount", e.target.value)}
              placeholder="0.00"
              min="0"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                errors.amount
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-white/[0.08] focus:border-violet-500/50",
              )}
            />
            {errors.amount && (
              <p className="text-xs text-red-400 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Category <span className="text-white/25">(optional)</span>
            </label>
            <SelectPrimitive.Root
              value={form.category_id}
              onValueChange={(val) => field("category_id", val)}
            >
              <SelectPrimitive.Trigger className="w-full flex items-center justify-between bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors data-[placeholder]:text-white/20">
                <SelectPrimitive.Value placeholder="Uncategorized" />
                <SelectPrimitive.Icon>
                  <ChevronDown size={14} className="text-white/30" />
                </SelectPrimitive.Icon>
              </SelectPrimitive.Trigger>
              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  position="popper"
                  sideOffset={4}
                  className="z-50 w-[var(--radix-select-trigger-width)] bg-[#141422] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                >
                  <SelectPrimitive.Viewport className="p-1">
                    <SelectPrimitive.Item
                      value="none"
                      className="flex items-center px-3 py-2 text-sm text-white/40 rounded-md cursor-pointer outline-none hover:bg-white/5 hover:text-white/70 transition-colors data-[highlighted]:bg-white/5 data-[highlighted]:text-white/70"
                    >
                      <SelectPrimitive.ItemText>
                        Uncategorized
                      </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                    {categories.length > 0 && (
                      <div className="my-1 h-px bg-white/5" />
                    )}
                    {categories.map((c) => (
                      <SelectPrimitive.Item
                        key={c.id}
                        value={String(c.id)}
                        className="flex items-center px-3 py-2 text-sm text-white rounded-md cursor-pointer outline-none hover:bg-white/5 transition-colors data-[highlighted]:bg-white/5 data-[state=checked]:text-violet-400"
                      >
                        <SelectPrimitive.ItemText>
                          {c.name}
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Date
            </label>
            <PopoverPrimitive.Root>
              <PopoverPrimitive.Trigger
                className={cn(
                  "w-full flex items-center justify-between bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                  errors.date
                    ? "border-red-500/40 text-red-400"
                    : "border-white/[0.08] text-white hover:border-white/20",
                )}
              >
                <span className={form.date ? "text-white" : "text-white/20"}>
                  {form.date
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(form.date + "T12:00:00"))
                    : "Pick a date"}
                </span>
                <CalendarIcon size={14} className="text-white/30" />
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  sideOffset={4}
                  className="z-50 bg-[#141422] border border-white/10 rounded-xl shadow-xl p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const d = new Date(
                          form.date ? form.date + "T12:00:00" : Date.now(),
                        );
                        d.setMonth(d.getMonth() - 1);
                        field("date", d.toISOString().split("T")[0]);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-medium text-white">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        year: "numeric",
                      }).format(
                        form.date
                          ? new Date(form.date + "T12:00:00")
                          : new Date(),
                      )}
                    </span>
                    <button
                      onClick={() => {
                        const d = new Date(
                          form.date ? form.date + "T12:00:00" : Date.now(),
                        );
                        d.setMonth(d.getMonth() + 1);
                        field("date", d.toISOString().split("T")[0]);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >
                      ›
                    </button>
                  </div>
                  <DayPicker
                    mode="single"
                    month={
                      form.date ? new Date(form.date + "T12:00:00") : new Date()
                    }
                    hideNavigation
                    selected={
                      form.date ? new Date(form.date + "T12:00:00") : undefined
                    }
                    onSelect={(day) => {
                      if (day) {
                        const local = new Date(
                          day.getTime() - day.getTimezoneOffset() * 60000,
                        );
                        field("date", local.toISOString().split("T")[0]);
                      }
                    }}
                    classNames={DAY_PICKER_CLASS_NAMES}
                  />
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
            {errors.date && (
              <p className="text-xs text-red-400 mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        {submitError && <ErrorBanner message={submitError} />}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
