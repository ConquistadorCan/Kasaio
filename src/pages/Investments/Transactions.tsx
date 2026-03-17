import { useEffect, useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { logError } from "../../lib/logger";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { cn } from "../../lib/utils";

export function InvestmentTransactions() {
  const { investmentTransactions, assets, setInvestmentTransactions, addInvestmentTransaction, refreshHolding } = useInvestmentStore();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mutating, setMutating] = useState(false);

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

  const commodities = assets.filter((a) => a.asset_type === "COMMODITY");

  const sorted = [...investmentTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Investment Transactions</h1>
          <p className="text-sm text-white/40 mt-0.5">{investmentTransactions.length} total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          New Transaction
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchTransactions} />
      ) : (
        <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[100px_1fr_80px_110px_110px_120px] px-5 py-3 border-b border-white/5 shrink-0">
            {["Date", "Asset", "Type", "Qty (g)", "Price", "Total"].map((col) => (
              <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                {col}
              </span>
            ))}
          </div>

          {sorted.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-white/20">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {sorted.map((t) => {
                const asset = assets.find((a) => a.id === t.asset_id);
                const isBuy = t.transaction_type === "BUY";
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
                        isBuy
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {t.transaction_type}
                      </span>
                    </span>
                    <span className="text-sm text-white/70 font-mono">{t.quantity.toFixed(2)}</span>
                    <span className="text-sm text-white/70 font-mono">₺{formatCurrency(t.price)}</span>
                    <span className="text-sm text-white font-mono">₺{formatCurrency(total)}</span>
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
          assets={commodities}
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}
    </div>
  );
}