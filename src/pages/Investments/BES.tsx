import { useState } from "react";
import { Plus, PenLine, CirclePlus, CalendarIcon } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { besApi } from "../../api/bes";
import { useBESStore } from "../../store/useBESStore";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { logError } from "../../lib/logger";
import { DAY_PICKER_CLASS_NAMES } from "../../components/transactions/types";
import { PageHeader } from "../../components/ui/primitives";
import type { BESPlan } from "../../types/bes";

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

const MODAL_STYLE = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 60,
    background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  box: {
    width: 400, background: "var(--bg-2)", border: "1px solid var(--line-strong)",
    borderRadius: "var(--r-4)", boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)",
    padding: 20, display: "flex", flexDirection: "column" as const, gap: 16,
  },
};

function AddPlanModal({ onClose, onCreated }: { onClose: () => void; onCreated: (plan: BESPlan) => void }) {
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

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 };

  return (
    <div style={MODAL_STYLE.overlay}>
      <div style={MODAL_STYLE.box}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Add BES Plan</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Plan Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anadolu Hayat – Agresif" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={labelStyle}>Company</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Anadolu Hayat" style={{ width: "100%" }} />
          </div>
          <div>
            <label style={labelStyle}>End Date <span style={{ fontWeight: 400, color: "var(--fg-5)", textTransform: "none" }}>(optional)</span></label>
            <PopoverPrimitive.Root open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverPrimitive.Trigger style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-2)", padding: "6px 10px", fontSize: 13, color: endDate ? "var(--fg)" : "var(--fg-5)", cursor: "pointer", outline: "none" }}>
                {endDate ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(endDate) : "Pick a date"}
                <CalendarIcon size={14} style={{ color: "var(--fg-4)" }} />
              </PopoverPrimitive.Trigger>
              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content sideOffset={4} style={{ zIndex: 70, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-3)", boxShadow: "0 8px 32px oklch(0 0 0 / 0.4)", padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <button type="button" onClick={() => setEndDateMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })} className="btn-icon">‹</button>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>
                      {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(endDateMonth)}
                    </span>
                    <button type="button" onClick={() => setEndDateMonth((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })} className="btn-icon">›</button>
                  </div>
                  <DayPicker mode="single" month={endDateMonth} hideNavigation selected={endDate} onSelect={(day) => { setEndDate(day); setEndDateOpen(false); }} classNames={DAY_PICKER_CLASS_NAMES} />
                  {endDate && (
                    <button type="button" onClick={() => { setEndDate(undefined); setEndDateOpen(false); }} style={{ marginTop: 8, width: "100%", padding: "6px", borderRadius: "var(--r-2)", fontSize: 11.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
          </div>
          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading || !name.trim() || !company.trim()} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddContributionModal({ planId, planName, onClose, onAdded }: {
  planId: number; planName: string; onClose: () => void; onAdded: (plan: BESPlan) => void;
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
      await besApi.addContribution(planId, { date: new Date(date).toISOString(), amount: parsed });
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

  const labelStyle = { display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 };

  return (
    <div style={MODAL_STYLE.overlay}>
      <div style={MODAL_STYLE.box}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Add Contribution</h2>
          <p style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>{planName}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label style={labelStyle}>Amount (₺)</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: "100%" }} />
          </div>
          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading || !amount || parseFloat(amount) <= 0} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UpdateValueModal({ plan, onClose, onUpdated }: {
  plan: BESPlan; onClose: () => void; onUpdated: (plan: BESPlan) => void;
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
    <div style={MODAL_STYLE.overlay}>
      <div style={MODAL_STYLE.box}>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Update Current Value</h2>
          <p style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 4 }}>{plan.name}</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Current Value (₺)
            </label>
            <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" style={{ width: "100%" }} />
          </div>
          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading || value === "" || parseFloat(value) < 0} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ActiveModal =
  | { type: "add-plan" }
  | { type: "add-contribution"; plan: BESPlan }
  | { type: "update-value"; plan: BESPlan }
  | null;

const COLS = "1fr 130px 130px 130px 100px 80px";

export function BES() {
  const { plans, upsertPlan } = useBESStore();
  const [modal, setModal] = useState<ActiveModal>(null);

  function handlePlanCreated(plan: BESPlan) { upsertPlan(plan); setModal(null); }
  function handlePlanUpdated(updated: BESPlan) { upsertPlan(updated); setModal(null); }
  function handleContributionAdded(updated: BESPlan) { upsertPlan(updated); setModal(null); }

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <PageHeader
        title="BES"
        meta={`${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
        actions={
          <button className="btn btn-primary" onClick={() => setModal({ type: "add-plan" })}>
            <Plus size={14} /> New Plan
          </button>
        }
      />

      <div className="surface" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="table-head" style={{ gridTemplateColumns: COLS }}>
          {["Plan", "Total Paid", "Current Value", "P&L", "End Date", ""].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>

        {plans.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No BES plans yet</p>
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            {plans.map((plan) => {
              const remaining = plan.end_date ? timeRemaining(plan.end_date) : null;
              return (
                <div
                  key={plan.id}
                  className="table-row"
                  style={{ gridTemplateColumns: COLS }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{plan.name}</p>
                    <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{plan.company}</p>
                  </div>

                  <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                    ₺{formatCurrency(plan.total_paid)}
                  </span>

                  <div>
                    {plan.current_value !== null ? (
                      <>
                        <span className="num" style={{ fontSize: 13, color: "var(--fg)" }}>₺{formatCurrency(plan.current_value)}</span>
                        {plan.last_updated && (
                          <p style={{ fontSize: 10.5, color: "var(--fg-5)", marginTop: 1 }}>{formatDate(plan.last_updated)}</p>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>
                    )}
                  </div>

                  <div>
                    {plan.pnl !== null ? (
                      <>
                        <p className="num" style={{ fontSize: 13, fontWeight: 500, color: plan.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {plan.pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(plan.pnl))}
                        </p>
                        <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: plan.pnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
                          {plan.pnl >= 0 ? "+" : ""}{plan.pnl_pct?.toFixed(2)}%
                        </p>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>
                    )}
                  </div>

                  <div>
                    {plan.end_date && remaining ? (
                      <>
                        <p className="num" style={{ fontSize: 13, fontWeight: 500, color: remaining.urgent ? "var(--danger)" : "var(--fg-2)" }}>
                          {remaining.label}
                        </p>
                        <p style={{ fontSize: 10.5, color: "var(--fg-5)", marginTop: 1 }}>{formatDate(plan.end_date)}</p>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => setModal({ type: "add-contribution", plan })}
                      title="Add contribution"
                      className="btn-icon"
                    >
                      <CirclePlus size={14} />
                    </button>
                    <button
                      onClick={() => setModal({ type: "update-value", plan })}
                      title="Update current value"
                      className="btn-icon"
                    >
                      <PenLine size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
