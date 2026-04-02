import { useState } from "react";
import { Plus, PenLine, CirclePlus, CalendarIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { besApi } from "../../api/bes";
import { useBESStore } from "../../store/useBESStore";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { logError } from "../../lib/logger";
import { cn } from "../../lib/utils";
import { DAY_PICKER_CLASS_NAMES } from "../../components/transactions/types";
import type { BESPlan } from "../../types/bes";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeRemaining(endDateStr: string): { label: string; urgent: boolean } {
  const end = new Date(endDateStr);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return { label: "Expired", urgent: true };

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);

  return { label: parts.join(" "), urgent: totalDays <= 30 };
}

// ── Modals ────────────────────────────────────────────────────────────────────

function AddPlanModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (plan: BESPlan) => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [endDateMonth, setEndDateMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await besApi.createPlan({
        name: name.trim(),
        company: company.trim(),
        end_date: endDate ? endDate.toISOString() : null,
      });
      onCreated(plan);
    } catch (err) {
      await logError("Failed to create BES plan", err);
      setError("Failed to create plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <h2 className="text-base font-semibold text-white">Add BES Plan</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Plan Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anadolu Hayat – Agresif"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Company</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Anadolu Hayat"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">
              End Date <span className="normal-case text-white/20">(optional)</span>
            </label>
            <PopoverPrimitive.Root open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverPrimitive.Trigger className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:border-white/20">
                <span className={endDate ? "text-white" : "text-white/20"}>
                  {endDate
                    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(endDate)
                    : "Pick a date"}
                </span>
                <CalendarIcon size={14} className="text-white/30" />
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  sideOffset={4}
                  className="z-[60] bg-[#141422] border border-white/10 rounded-xl shadow-xl p-3"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setEndDateMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >‹</button>
                    <span className="text-sm font-medium text-white">
                      {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(endDateMonth)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEndDateMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-2xl leading-none"
                    >›</button>
                  </div>
                  <DayPicker
                    mode="single"
                    month={endDateMonth}
                    hideNavigation
                    selected={endDate}
                    onSelect={(day) => {
                      setEndDate(day);
                      setEndDateOpen(false);
                    }}
                    classNames={DAY_PICKER_CLASS_NAMES}
                  />
                  {endDate && (
                    <button
                      type="button"
                      onClick={() => { setEndDate(undefined); setEndDateOpen(false); }}
                      className="mt-2 w-full py-1.5 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !company.trim()}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddContributionModal({
  planId,
  planName,
  onClose,
  onAdded,
}: {
  planId: number;
  planName: string;
  onClose: () => void;
  onAdded: (plan: BESPlan) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!date || isNaN(parsed) || parsed <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await besApi.addContribution(planId, {
        date: new Date(date).toISOString(),
        amount: parsed,
      });
      const plans = await besApi.listPlans();
      const updated = plans.find((p) => p.id === planId);
      if (updated) onAdded(updated);
    } catch (err) {
      await logError("Failed to add BES contribution", err);
      setError("Failed to add contribution. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Add Contribution</h2>
          <p className="text-sm text-white/40 mt-0.5">{planName}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Amount (₺)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateValueModal({
  plan,
  onClose,
  onUpdated,
}: {
  plan: BESPlan;
  onClose: () => void;
  onUpdated: (plan: BESPlan) => void;
}) {
  const [value, setValue] = useState(plan.current_value?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await besApi.updateValue(plan.id, parsed);
      onUpdated(updated);
    } catch (err) {
      await logError("Failed to update BES value", err);
      setError("Failed to update value. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Update Current Value</h2>
          <p className="text-sm text-white/40 mt-0.5">{plan.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">Current Value (₺)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || value === "" || parseFloat(value) < 0}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveModal =
  | { type: "add-plan" }
  | { type: "add-contribution"; plan: BESPlan }
  | { type: "update-value"; plan: BESPlan }
  | null;

export function BES() {
  const { plans, upsertPlan, setPlans } = useBESStore();
  const [modal, setModal] = useState<ActiveModal>(null);

  function handlePlanCreated(plan: BESPlan) {
    upsertPlan(plan);
    setModal(null);
  }

  function handlePlanUpdated(updated: BESPlan) {
    upsertPlan(updated);
    setModal(null);
  }

  function handleContributionAdded(updated: BESPlan) {
    upsertPlan(updated);
    setModal(null);
  }

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">BES</h1>
          <p className="text-sm text-white/40 mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setModal({ type: "add-plan" })}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Plan
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-[1fr_130px_130px_130px_100px_100px] px-5 py-3 border-b border-white/5 shrink-0">
          {["Plan", "Total Paid", "Current Value", "P&L", "End Date", "Actions"].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {plans.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-white/20">No BES plans yet</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {plans.map((plan) => {
              const remaining = plan.end_date ? timeRemaining(plan.end_date) : null;
              return (
                <div
                  key={plan.id}
                  className="grid grid-cols-[1fr_130px_130px_130px_100px_100px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                >
                  {/* Plan info */}
                  <div>
                    <p className="text-sm font-medium text-white">{plan.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{plan.company}</p>
                  </div>

                  {/* Total Paid */}
                  <span className="text-sm text-white/70 font-mono">
                    ₺{formatCurrency(plan.total_paid)}
                  </span>

                  {/* Current Value */}
                  <div>
                    {plan.current_value !== null ? (
                      <>
                        <span className="text-sm text-white font-mono">
                          ₺{formatCurrency(plan.current_value)}
                        </span>
                        {plan.last_updated && (
                          <p className="text-xs text-white/20 mt-0.5">{formatDate(plan.last_updated)}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-white/20">—</span>
                    )}
                  </div>

                  {/* P&L */}
                  <div>
                    {plan.pnl !== null ? (
                      <>
                        <p className={cn("text-sm font-mono font-medium", plan.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {plan.pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(plan.pnl))}
                        </p>
                        <p className={cn("text-xs font-mono mt-0.5", plan.pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                          {plan.pnl >= 0 ? "+" : ""}{plan.pnl_pct?.toFixed(2)}%
                        </p>
                      </>
                    ) : (
                      <span className="text-sm text-white/20">—</span>
                    )}
                  </div>

                  {/* End Date / Time Remaining */}
                  <div>
                    {plan.end_date && remaining ? (
                      <>
                        <p className={cn("text-sm font-mono font-medium", remaining.urgent ? "text-red-400" : "text-white/60")}>
                          {remaining.label}
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">{formatDate(plan.end_date)}</p>
                      </>
                    ) : (
                      <span className="text-sm text-white/20">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModal({ type: "add-contribution", plan })}
                      title="Add contribution"
                      className="p-1.5 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                    >
                      <CirclePlus size={15} />
                    </button>
                    <button
                      onClick={() => setModal({ type: "update-value", plan })}
                      title="Update current value"
                      className="p-1.5 rounded-lg text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                    >
                      <PenLine size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add-plan" && (
        <AddPlanModal onClose={() => setModal(null)} onCreated={handlePlanCreated} />
      )}
      {modal?.type === "add-contribution" && (
        <AddContributionModal
          planId={modal.plan.id}
          planName={modal.plan.name}
          onClose={() => setModal(null)}
          onAdded={handleContributionAdded}
        />
      )}
      {modal?.type === "update-value" && (
        <UpdateValueModal
          plan={modal.plan}
          onClose={() => setModal(null)}
          onUpdated={handlePlanUpdated}
        />
      )}
    </div>
  );
}
