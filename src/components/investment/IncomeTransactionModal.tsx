import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import { DayPicker } from "react-day-picker";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { DAY_PICKER_CLASS_NAMES } from "../../components/transactions/types";
import { ErrorBanner } from "../../components/ui/ErrorComponents";
import { useInvestmentStore } from "../../store/useInvestmentStore";

interface FormData {
  asset_id: string;
  quantity: string;
  price: string;
  date: string;
}

const EMPTY_FORM: FormData = {
  asset_id: "",
  quantity: "",
  price: "",
  date: new Date().toISOString().split("T")[0],
};

interface IncomeTransactionModalProps {
  onSubmit: (data: {
    asset_id: number;
    transaction_type: "INCOME";
    quantity: number;
    price: number;
    date: string;
  }) => Promise<string | undefined>;
  onClose: () => void;
  loading: boolean;
}

export function IncomeTransactionModal({ onSubmit, onClose, loading }: IncomeTransactionModalProps) {
  const { assets, holdings } = useInvestmentStore();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitError, setSubmitError] = useState("");
  const [pickerView, setPickerView] = useState<"day" | "month" | "year">("day");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const currentPickerDate = form.date ? new Date(form.date + "T12:00:00") : new Date();
  const pickerYear = currentPickerDate.getFullYear();

  const activeAssets = assets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity > 0));
  const pastAssets = assets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity === 0));
  const neverHeldAssets = assets.filter((a) => !holdings.some((h) => h.asset_id === a.id));

  const selectedAsset = form.asset_id ? assets.find((a) => a.id === Number(form.asset_id)) : undefined;
  const currency = selectedAsset?.currency ?? "TRY";
  const currencySymbol = currency === "USD" ? "$" : "₺";

  function field(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError("");
  }

  function handleAssetChange(assetId: string) {
    const holding = holdings.find((h) => h.asset_id === Number(assetId) && h.quantity > 0);
    if (holding) {
      setForm((prev) => ({ ...prev, asset_id: assetId, quantity: String(holding.quantity) }));
    } else {
      setForm((prev) => ({ ...prev, asset_id: assetId, quantity: "" }));
    }
    setErrors((prev) => ({ ...prev, asset_id: undefined, quantity: undefined }));
    setSubmitError("");
  }

  function validate(): boolean {
    const next: Partial<FormData> = {};
    if (!form.asset_id) next.asset_id = "Required";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      next.quantity = "Enter a valid quantity";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      next.price = "Enter a valid amount";
    if (!form.date) next.date = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitError("");
    const err = await onSubmit({
      asset_id: Number(form.asset_id),
      transaction_type: "INCOME",
      quantity: Number(form.quantity),
      price: Number(form.price),
      date: form.date,
    });
    if (err) setSubmitError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-1">Record Income</h2>
        <p className="text-xs text-white/30 mb-5">Dividend, coupon, or other investment income</p>

        <div className="flex flex-col gap-4">
          {/* Asset */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Asset</label>
            <SelectPrimitive.Root value={form.asset_id} onValueChange={handleAssetChange}>
              <SelectPrimitive.Trigger
                className={cn(
                  "w-full flex items-center justify-between bg-white/5 border rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors data-[placeholder]:text-white/20",
                  errors.asset_id ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
                )}
              >
                <SelectPrimitive.Value placeholder="Select asset" />
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
                    {activeAssets.length > 0 && (
                      <SelectPrimitive.Group>
                        <SelectPrimitive.Label className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                          Active Holdings
                        </SelectPrimitive.Label>
                        {activeAssets.map((a) => {
                          const holding = holdings.find((h) => h.asset_id === a.id);
                          return (
                            <SelectPrimitive.Item
                              key={a.id}
                              value={String(a.id)}
                              className="flex items-center justify-between px-3 py-2 text-sm text-white rounded-md cursor-pointer outline-none hover:bg-white/5 transition-colors data-[highlighted]:bg-white/5 data-[state=checked]:text-violet-400"
                            >
                              <SelectPrimitive.ItemText>{a.name}</SelectPrimitive.ItemText>
                              {holding && (
                                <span className="text-xs text-white/30 ml-3 font-mono tabular-nums">
                                  {holding.quantity.toLocaleString("tr-TR", { maximumFractionDigits: 6 })} units
                                </span>
                              )}
                            </SelectPrimitive.Item>
                          );
                        })}
                      </SelectPrimitive.Group>
                    )}

                    {pastAssets.length > 0 && (
                      <>
                        {activeAssets.length > 0 && <div className="my-1 h-px bg-white/5" />}
                        <SelectPrimitive.Group>
                          <SelectPrimitive.Label className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                            Past Assets
                          </SelectPrimitive.Label>
                          {pastAssets.map((a) => (
                            <SelectPrimitive.Item
                              key={a.id}
                              value={String(a.id)}
                              className="flex items-center justify-between px-3 py-2 text-sm text-white/50 rounded-md cursor-pointer outline-none hover:bg-white/5 hover:text-white/70 transition-colors data-[highlighted]:bg-white/5 data-[state=checked]:text-violet-400"
                            >
                              <SelectPrimitive.ItemText>{a.name}</SelectPrimitive.ItemText>
                              <span className="text-xs text-white/20 ml-3">sold out</span>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Group>
                      </>
                    )}

                    {neverHeldAssets.length > 0 && (
                      <>
                        {(activeAssets.length > 0 || pastAssets.length > 0) && <div className="my-1 h-px bg-white/5" />}
                        <SelectPrimitive.Group>
                          <SelectPrimitive.Label className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                            All Assets
                          </SelectPrimitive.Label>
                          {neverHeldAssets.map((a) => (
                            <SelectPrimitive.Item
                              key={a.id}
                              value={String(a.id)}
                              className="flex items-center px-3 py-2 text-sm text-white/40 rounded-md cursor-pointer outline-none hover:bg-white/5 hover:text-white/60 transition-colors data-[highlighted]:bg-white/5 data-[state=checked]:text-violet-400"
                            >
                              <SelectPrimitive.ItemText>{a.name}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Group>
                      </>
                    )}
                  </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
            {errors.asset_id && <p className="text-xs text-red-400 mt-1">{errors.asset_id}</p>}
          </div>

          {/* Units held */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Units held</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => field("quantity", e.target.value)}
              placeholder="0.00"
              min="0"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                errors.quantity ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
              )}
            />
            {errors.quantity && <p className="text-xs text-red-400 mt-1">{errors.quantity}</p>}
          </div>

          {/* Income per unit */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Income per unit ({currency})
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => field("price", e.target.value)}
              placeholder="0.00"
              min="0"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                errors.price ? "border-red-500/40" : "border-white/[0.08] focus:border-violet-500/50"
              )}
            />
            {errors.price && <p className="text-xs text-red-400 mt-1">{errors.price}</p>}
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded-lg">
            <span className="text-xs text-white/40">Total income</span>
            <span className="text-sm font-mono font-medium text-amber-400">
              {form.quantity && form.price && !isNaN(Number(form.quantity)) && !isNaN(Number(form.price))
                ? `${currencySymbol}${(Number(form.quantity) * Number(form.price)).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—"}
            </span>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Date</label>
            <PopoverPrimitive.Root
              open={datePickerOpen}
              onOpenChange={(open) => { setDatePickerOpen(open); if (!open) setPickerView("day"); }}
            >
              <PopoverPrimitive.Trigger
                className={cn(
                  "w-full flex items-center justify-between bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                  errors.date ? "border-red-500/40 text-red-400" : "border-white/[0.08] text-white hover:border-white/20"
                )}
              >
                <span className={form.date ? "text-white" : "text-white/20"}>
                  {form.date
                    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(form.date + "T12:00:00"))
                    : "Pick a date"}
                </span>
                <CalendarIcon size={14} className="text-white/30" />
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content sideOffset={4} className="z-50 bg-[#141422] border border-white/10 rounded-xl shadow-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                        if (pickerView === "day") d.setMonth(d.getMonth() - 1);
                        else d.setFullYear(d.getFullYear() - 1);
                        field("date", d.toISOString().split("T")[0]);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >‹</button>
                    {pickerView === "year" ? (
                      <span className="text-sm font-medium text-white px-2 py-1">
                        {`${pickerYear - 6} – ${pickerYear + 5}`}
                      </span>
                    ) : (
                      <button
                        onClick={() => setPickerView((v) => v === "day" ? "month" : "year")}
                        className="text-sm font-medium text-white hover:text-violet-300 transition-colors px-2 py-1 rounded-lg hover:bg-violet-500/10"
                      >
                        {pickerView === "day"
                          ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentPickerDate)
                          : pickerYear}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                        if (pickerView === "day") d.setMonth(d.getMonth() + 1);
                        else d.setFullYear(d.getFullYear() + 1);
                        field("date", d.toISOString().split("T")[0]);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >›</button>
                  </div>

                  {pickerView === "year" ? (
                    <div className="grid grid-cols-3 grid-rows-4 h-[192px] w-[224px]">
                      {Array.from({ length: 12 }, (_, i) => {
                        const year = pickerYear - 6 + i;
                        return (
                          <button
                            key={year}
                            onClick={() => {
                              const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                              d.setFullYear(year);
                              field("date", d.toISOString().split("T")[0]);
                              setPickerView("month");
                            }}
                            className={cn(
                              "flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                              pickerYear === year ? "bg-violet-500/30 text-violet-300" : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  ) : pickerView === "month" ? (
                    <div className="grid grid-cols-3 grid-rows-4 h-[192px] w-[224px]">
                      {Array.from({ length: 12 }, (_, i) => {
                        const label = new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, i, 1));
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              const d = new Date(form.date ? form.date + "T12:00:00" : Date.now());
                              d.setMonth(i);
                              field("date", d.toISOString().split("T")[0]);
                              setPickerView("day");
                            }}
                            className={cn(
                              "flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                              currentPickerDate.getMonth() === i ? "bg-violet-500/30 text-violet-300" : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
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
                        className="mt-2 w-full py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                      >
                        Today
                      </button>
                    </>
                  )}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
            {errors.date && <p className="text-xs text-red-400 mt-1">{errors.date}</p>}
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
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Record Income"}
          </button>
        </div>
      </div>
    </div>
  );
}
