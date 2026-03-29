import { useEffect, useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { IncomeTransactionModal } from "../../components/investment/IncomeTransactionModal";
import { cn } from "../../lib/utils";

export function InvestmentTransactions() {
  const { investmentTransactions, assets, holdings, setInvestmentTransactions, addInvestmentTransaction, refreshHolding } = useInvestmentStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [mutating, setMutating] = useState(false);
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
      const txn = await investmentTransactionsApi.create({
        ...data,
        date: new Date(data.date).toISOString(),
      });
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
      const txn = await investmentTransactionsApi.create({
        ...data,
        date: new Date(data.date).toISOString(),
      });
      addInvestmentTransaction(txn);
      setShowIncomeModal(false);
    } catch (err) {
      await logError("Failed to record income", err);
      return "Failed to record income. Please try again.";
    } finally {
      setMutating(false);
    }
  }


  const sorted = [...investmentTransactions]
    .filter((t) => filterAsset === "all" || t.asset_id === filterAsset)
    .filter((t) => filterType === "all" || t.transaction_type === filterType)
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Investment Transactions</h1>
          <p className="text-sm text-white/40 mt-0.5">{investmentTransactions.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIncomeModal(true)}
            className="flex items-center gap-2 bg-amber-600/80 hover:bg-amber-500/80 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Record Income
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            New Transaction
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Type filter */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {(["all", "BUY", "SELL", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                filterType === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>

        {/* Asset filter */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          <button
            onClick={() => setFilterAsset("all")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              filterAsset === "all" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            All
          </button>
          {assets.map((a) => (
            <button
              key={a.id}
              onClick={() => setFilterAsset(a.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                filterAsset === a.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError!} onRetry={fetchTransactions} />
      ) : (
        <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[100px_1fr_80px_110px_110px_120px] px-5 py-3 border-b border-white/5 shrink-0">
            {["Date", "Asset", "Type", "Qty (g)", "Price", "Total"].map((col) =>
              col === "Date" ? (
                <button
                  key={col}
                  onClick={() => setSortOrder((prev) => prev === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-1 text-[11px] font-medium text-white/30 uppercase tracking-wider hover:text-white/60 transition-colors"
                >
                  Date
                  <span className="text-[10px]">{sortOrder === "desc" ? "↓" : "↑"}</span>
                </button>
              ) : (
                <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  {col}
                </span>
              )
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-white/20">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {sorted.map((t) => {
                const asset = assets.find((a) => a.id === t.asset_id);
                const total = t.quantity * t.price;
                return (
                  <div
                    key={t.id}
                    className="grid grid-cols-[100px_1fr_80px_110px_110px_120px] px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <span className="text-sm text-white/40">{formatDate(t.date)}</span>
                    <div>
                      <p className="text-sm text-white">{asset?.name ?? "—"}</p>
                      <p className="text-xs text-white/30">{asset?.symbol ?? "—"}</p>
                    </div>
                    <span>
                      <span className={cn(
                        "text-[11px] font-medium px-2 py-1 rounded-full border",
                        t.transaction_type === "BUY"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : t.transaction_type === "SELL"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {t.transaction_type}
                      </span>
                    </span>
                    <span className="text-sm text-white/70 font-mono">{t.quantity.toFixed(2)}</span>
                    <span className="text-sm text-white/70 font-mono">{asset?.currency === "USD" ? "$" : "₺"}{formatCurrency(t.price)}</span>
                    <span className="text-sm text-white font-mono">{asset?.currency === "USD" ? "$" : "₺"}{formatCurrency(total)}</span>
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
    </div>
  );
}