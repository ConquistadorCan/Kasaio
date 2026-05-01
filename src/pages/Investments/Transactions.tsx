import { useEffect, useCallback, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { IncomeTransactionModal } from "../../components/investment/IncomeTransactionModal";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PageHeader } from "../../components/ui/primitives";
import type { InvestmentTransaction } from "../../types/investments";

const COLS = "100px 1fr 80px 110px 110px 120px 64px";

const TYPE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  BUY: { bg: "var(--success-bg)", color: "var(--success)", border: "oklch(0.78 0.15 155 / 0.25)" },
  SELL: { bg: "var(--danger-bg)", color: "var(--danger)", border: "oklch(0.70 0.20 25 / 0.25)" },
  INCOME: { bg: "var(--warning-bg)", color: "var(--warning)", border: "oklch(0.80 0.14 75 / 0.25)" },
};

export function InvestmentTransactions() {
  const { investmentTransactions, assets, holdings, setInvestmentTransactions, addInvestmentTransaction, updateInvestmentTransaction, removeInvestmentTransaction, refreshHolding, removeHolding } = useInvestmentStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [editing, setEditing] = useState<InvestmentTransaction | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterAsset, setFilterAsset] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<"BUY" | "SELL" | "INCOME" | "all">("all");

  const fetchTransactions = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const data = await investmentTransactionsApi.list();
      setInvestmentTransactions(data);
    } catch (err) {
      await logError("Failed to load investment transactions", err);
      setFetchError("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [setInvestmentTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  async function handleAdd(data: {
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
    } catch (err) {
      await logError("Failed to record income", err);
      return "Failed to record income. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleEdit(data: {
    asset_id: number;
    transaction_type: "BUY" | "SELL";
    quantity: number;
    price: number;
    date: string;
  }): Promise<string | undefined> {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await investmentTransactionsApi.update(editing.id, {
        transaction_type: data.transaction_type,
        quantity: data.quantity,
        price: data.price,
        date: new Date(data.date).toISOString(),
      });
      updateInvestmentTransaction(updated);
      const updatedHolding = await holdingsApi.get(data.asset_id);
      refreshHolding(updatedHolding);
      setEditing(null);
    } catch (err) {
      await logError("Failed to update investment transaction", err);
      return "Failed to update transaction. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleEditIncome(data: {
    asset_id: number;
    transaction_type: "INCOME";
    quantity: number;
    price: number;
    date: string;
  }): Promise<string | undefined> {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await investmentTransactionsApi.update(editing.id, {
        transaction_type: data.transaction_type,
        quantity: data.quantity,
        price: data.price,
        date: new Date(data.date).toISOString(),
      });
      updateInvestmentTransaction(updated);
      setEditing(null);
    } catch (err) {
      await logError("Failed to update income transaction", err);
      return "Failed to update transaction. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id: number) {
    const txn = investmentTransactions.find((t) => t.id === id);
    if (!txn) return;
    try {
      await investmentTransactionsApi.delete(id);
      removeInvestmentTransaction(id);
      try {
        const updatedHolding = await holdingsApi.get(txn.asset_id);
        refreshHolding(updatedHolding);
      } catch {
        removeHolding(txn.asset_id);
      }
    } catch (err) {
      await logError("Failed to delete investment transaction", err);
    }
  }

  const sorted = [...investmentTransactions]
    .filter((t) => filterAsset === "all" || t.asset_id === filterAsset)
    .filter((t) => filterType === "all" || t.transaction_type === filterType)
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  const filterBtnStyle = (active: boolean) => ({
    padding: "4px 12px", borderRadius: "var(--r-1)", fontSize: 12,
    fontWeight: 500, border: "none", cursor: "pointer", transition: "all 80ms",
    background: active ? "var(--bg-3)" : "transparent",
    color: active ? "var(--fg)" : "var(--fg-4)",
  });

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <PageHeader
        title="Investment Transactions"
        meta={`${investmentTransactions.length} total`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setShowIncomeModal(true)}>
              <Plus size={13} /> Record Income
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={13} /> New Transaction
            </button>
          </>
        }
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Type filter */}
        <div style={{ display: "flex", gap: 2, background: "var(--bg-1)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-2)", padding: 3 }}>
          {(["all", "BUY", "SELL", "INCOME"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} style={filterBtnStyle(filterType === t)}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>

        {/* Asset filter */}
        {assets.length > 0 && (
          <div style={{ display: "flex", gap: 2, background: "var(--bg-1)", border: "1px solid var(--line-soft)", borderRadius: "var(--r-2)", padding: 3 }}>
            <button onClick={() => setFilterAsset("all")} style={filterBtnStyle(filterAsset === "all")}>All</button>
            {assets.map((a) => (
              <button key={a.id} onClick={() => setFilterAsset(a.id)} style={filterBtnStyle(filterAsset === a.id)}>
                {a.symbol}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchTransactions} />
      ) : (
        <div className="surface" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="table-head" style={{ gridTemplateColumns: COLS }}>
            {["Date", "Asset", "Type", "Qty", "Price", "Total", ""].map((col, i) =>
              col === "Date" ? (
                <button
                  key={i}
                  onClick={() => setSortOrder((prev) => prev === "desc" ? "asc" : "desc")}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.07em", background: "none", border: "none", cursor: "pointer" }}
                >
                  Date <span style={{ fontSize: 10 }}>{sortOrder === "desc" ? "↓" : "↑"}</span>
                </button>
              ) : (
                <span key={i}>{col}</span>
              )
            )}
          </div>

          {sorted.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No transactions yet</p>
            </div>
          ) : (
            <div style={{ overflowY: "auto", flex: 1 }}>
              {sorted.map((t) => {
                const asset = assets.find((a) => a.id === t.asset_id);
                const total = t.quantity * t.price;
                const sym = asset?.currency === "USD" ? "$" : "₺";
                const typeStyle = TYPE_STYLE[t.transaction_type];
                return (
                  <div
                    key={t.id}
                    className="table-row group"
                    style={{ gridTemplateColumns: COLS }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <span style={{ fontSize: 13, color: "var(--fg-4)" }}>{formatDate(t.date)}</span>
                    <div>
                      <p style={{ fontSize: 13, color: "var(--fg)" }}>{asset?.name ?? "—"}</p>
                      <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{asset?.symbol ?? "—"}</p>
                    </div>
                    <span>
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: "var(--r-1)",
                        border: `1px solid ${typeStyle.border}`,
                        background: typeStyle.bg, color: typeStyle.color,
                      }}>
                        {t.transaction_type}
                      </span>
                    </span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{t.quantity.toFixed(2)}</span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{sym}{formatCurrency(t.price)}</span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg)" }}>{sym}{formatCurrency(total)}</span>
                    <div className="opacity-0 group-hover:opacity-100" style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end", transition: "opacity 80ms" }}>
                      <button
                        onClick={() => setEditing(t)}
                        className="btn-icon"
                        style={{ width: 26, height: 26 }}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setConfirmId(t.id)}
                        className="btn-icon"
                        style={{ width: 26, height: 26, color: "var(--danger)" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TransactionModal
          mode="add"
          assets={assets}
          holdings={holdings}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}

      {showIncomeModal && (
        <IncomeTransactionModal
          onSubmit={handleAddIncome}
          onClose={() => setShowIncomeModal(false)}
          loading={mutating}
        />
      )}

      {editing && editing.transaction_type !== "INCOME" && (
        <TransactionModal
          mode="edit"
          initial={{
            asset_id: editing.asset_id,
            transaction_type: editing.transaction_type as "BUY" | "SELL",
            quantity: editing.quantity,
            price: editing.price,
            date: editing.date,
          }}
          assets={assets}
          holdings={holdings}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={mutating}
        />
      )}

      {editing && editing.transaction_type === "INCOME" && (
        <IncomeTransactionModal
          mode="edit"
          prefillAssetId={editing.asset_id}
          prefillQuantity={editing.quantity}
          prefillPricePerUnit={editing.price}
          prefillDate={editing.date}
          onSubmit={handleEditIncome}
          onClose={() => setEditing(null)}
          loading={mutating}
        />
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title="Delete transaction?"
          description="This will recalculate your holding. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            handleDelete(confirmId);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
          danger
        />
      )}
    </div>
  );
}
