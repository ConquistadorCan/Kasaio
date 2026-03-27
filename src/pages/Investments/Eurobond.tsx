import { useState } from "react";
import { Plus } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { logError } from "../../lib/logger";
import { formatCurrency } from "../../lib/formatters";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { cn } from "../../lib/utils";

function currencySymbol(currency: string) {
  return currency === "USD" ? "$" : "₺";
}

export function Eurobond() {
  const { assets, holdings, latestPrices, addInvestmentTransaction, refreshHolding } = useInvestmentStore();
  const [showModal, setShowModal] = useState(false);
  const [mutating, setMutating] = useState(false);

  const eurobondAssets = assets.filter((a) => a.asset_type === "EUROBOND");

  const rows = eurobondAssets.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const latestPrice = latestPrices[asset.id]?.price ?? null;
    const sym = currencySymbol(asset.currency);
    return { asset, holding, latestPrice, sym };
  });

  async function handleAddTransaction(data: {
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

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
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

      <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-[1fr_80px_80px_120px_120px_120px_120px] px-5 py-3 border-b border-white/5 shrink-0">
          {["Asset", "CCY", "Qty", "Avg Cost", "Price", "Value", "P&L"].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-white/20">No Eurobonds found</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {rows.map(({ asset, holding, latestPrice, sym }) => (
              <div
                key={asset.id}
                className="grid grid-cols-[1fr_80px_80px_120px_120px_120px_120px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{asset.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{asset.symbol}</p>
                </div>
                <span className="text-xs text-white/40 font-mono">{asset.currency}</span>
                <span className="text-sm text-white/70 font-mono">
                  {holding ? holding.quantity.toFixed(2) : "—"}
                </span>
                <span className="text-sm text-white/70 font-mono">
                  {holding ? `${sym}${formatCurrency(holding.average_cost)}` : "—"}
                </span>
                <span className="text-sm text-white font-mono">
                  {latestPrice !== null ? `${sym}${formatCurrency(latestPrice)}` : "—"}
                </span>
                <span className="text-sm text-white font-mono">
                  {holding?.current_value != null ? `${sym}${formatCurrency(holding.current_value)}` : "—"}
                </span>
                <div>
                  {holding?.pnl != null ? (
                    <>
                      <p className={cn("text-sm font-mono font-medium", holding.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {holding.pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(holding.pnl))}
                      </p>
                      <p className={cn("text-xs font-mono mt-0.5", holding.pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                        {holding.pnl >= 0 ? "+" : ""}{holding.pnl_pct?.toFixed(2)}%
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-white/20">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          mode="add"
          assets={eurobondAssets}
          onSubmit={handleAddTransaction}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}
    </div>
  );
}
