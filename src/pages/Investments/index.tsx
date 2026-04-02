import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { portfolioApi } from "../../api/portfolioApi";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { useBESStore } from "../../store/useBESStore";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { logError } from "../../lib/logger";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { cn } from "../../lib/utils";
import type { PortfolioSummary } from "../../types/investments";

const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: "Commodity",
  CRYPTOCURRENCY: "Crypto",
  TEFAS_FUND: "TEFAS",
  ETF: "ETF",
  EUROBOND: "Eurobond",
};

function currencySymbol(currency: string) {
  return currency === "USD" ? "$" : "₺";
}

export function InvestmentsPortfolio() {
  const navigate = useNavigate();
  const { investmentTransactions } = useInvestmentStore();
  const { plans: besPlans } = useBESStore();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const fetchSummary = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const data = await portfolioApi.summary();
      setSummary(data);
    } catch (err) {
      await logError("Failed to load portfolio summary", err);
      setFetchError("Failed to load portfolio.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Portfolio</h1>
        <p className="text-sm text-white/40 mt-0.5">{summary?.holdings.filter((h) => h.quantity > 0).length ?? 0} positions</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchSummary} />
      ) : (
        <>
          {/* Holdings table */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_100px_120px_120px_130px] px-5 py-3 border-b border-white/5">
              {["Asset", "Type", "CCY", "Qty", "Avg Cost", "Value", "P&L"].map((col) => (
                <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  {col}
                </span>
              ))}
            </div>

            {!summary || summary.holdings.filter((h) => h.quantity > 0).length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-white/20">No positions yet</p>
              </div>
            ) : (
              summary.holdings.filter((h) => h.quantity > 0).map((h) => {
                const sym = currencySymbol(h.asset.currency);
                const totalIncome = investmentTransactions
                  .filter((t) => t.asset_id === h.asset.id && t.transaction_type === "INCOME")
                  .reduce((sum, t) => sum + t.quantity * t.price, 0);
                const pnl = h.pnl != null ? h.pnl + totalIncome : totalIncome !== 0 ? totalIncome : null;
                const pnlPct = pnl != null && h.cost_basis > 0 ? (pnl / h.cost_basis) * 100 : h.pnl_pct;
                const isProfit = (pnl ?? 0) >= 0;

                return (
                  <div
                    key={h.asset.id}
                    className="grid grid-cols-[1fr_80px_80px_100px_120px_120px_130px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{h.asset.name}</p>
                      <p className="text-xs text-white/30 mt-0.5">{h.asset.symbol}</p>
                    </div>
                    <span className="text-xs text-white/40">
                      {ASSET_TYPE_LABELS[h.asset.asset_type] ?? h.asset.asset_type}
                    </span>
                    <span className="text-xs text-white/40 font-mono">{h.asset.currency}</span>
                    <span className="text-sm text-white/70 font-mono">{h.quantity.toFixed(2)}</span>
                    <span className="text-sm text-white/70 font-mono">
                      {sym}{formatCurrency(h.average_cost)}
                    </span>
                    <span className="text-sm text-white font-mono">
                      {h.current_value != null ? `${sym}${formatCurrency(h.current_value)}` : "—"}
                    </span>
                    <div>
                      {pnl != null ? (
                        <>
                          <p className={cn("text-sm font-mono font-medium", isProfit ? "text-emerald-400" : "text-red-400")}>
                            {isProfit ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                          </p>
                          {pnlPct != null && (
                            <p className={cn("text-xs font-mono mt-0.5", isProfit ? "text-emerald-400/60" : "text-red-400/60")}>
                              {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-white/20">—</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Closed positions */}
          {summary && (() => {
            const closed = summary.holdings.filter((h) => h.quantity === 0);
            if (closed.length === 0) return null;
            return (
              <div>
                <button
                  onClick={() => setShowClosed((p) => !p)}
                  className="flex items-center gap-2 text-sm text-white/30 hover:text-white/50 transition-colors"
                >
                  <ChevronDown size={14} className={cn("transition-transform", showClosed && "rotate-180")} />
                  Closed Positions ({closed.length})
                </button>
                {showClosed && (
                  <div className="mt-2 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1fr_80px_80px_160px] px-5 py-3 border-b border-white/5">
                      {["Asset", "Type", "CCY", "Realized P&L"].map((col) => (
                        <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
                      ))}
                    </div>
                    {closed.map((h) => {
                      const sym = currencySymbol(h.asset.currency);
                      const totalIncome = investmentTransactions
                        .filter((t) => t.asset_id === h.asset.id && t.transaction_type === "INCOME")
                        .reduce((sum, t) => sum + t.quantity * t.price, 0);
                      const realizedPnl = (h.pnl ?? h.realized_pnl) + totalIncome;
                      const isProfit = realizedPnl >= 0;
                      const totalInvested = investmentTransactions
                        .filter((t) => t.asset_id === h.asset.id && t.transaction_type === "BUY")
                        .reduce((sum, t) => sum + t.quantity * t.price, 0);
                      const realizedPnlPct = totalInvested > 0 ? (realizedPnl / totalInvested) * 100 : null;
                      return (
                        <div key={h.asset.id} className="grid grid-cols-[1fr_80px_80px_160px] px-5 py-4 border-b border-white/5 last:border-0 items-center">
                          <div>
                            <p className="text-sm font-medium text-white/50">{h.asset.name}</p>
                            <p className="text-xs text-white/20 mt-0.5">{h.asset.symbol}</p>
                          </div>
                          <span className="text-xs text-white/30">
                            {ASSET_TYPE_LABELS[h.asset.asset_type] ?? h.asset.asset_type}
                          </span>
                          <span className="text-xs text-white/30 font-mono">{h.asset.currency}</span>
                          <div>
                            <p className={cn("text-sm font-mono font-medium", isProfit ? "text-emerald-400" : "text-red-400")}>
                              {isProfit ? "+" : ""}{sym}{formatCurrency(Math.abs(realizedPnl))}
                            </p>
                            {realizedPnlPct !== null && (
                              <p className={cn("text-xs font-mono mt-0.5", isProfit ? "text-emerald-400/60" : "text-red-400/60")}>
                                {isProfit ? "+" : ""}{realizedPnlPct.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* BES Plans */}
          {besPlans.length > 0 && (
            <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">BES Plans</span>
                <button
                  onClick={() => navigate("/investments/bes")}
                  className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                >
                  Manage <ArrowRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-[1fr_130px_130px_130px] px-5 py-3 border-b border-white/5">
                {["Plan", "Total Paid", "Current Value", "P&L"].map((col) => (
                  <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
                ))}
              </div>
              {besPlans.map((plan) => (
                <div key={plan.id} className="grid grid-cols-[1fr_130px_130px_130px] px-5 py-4 border-b border-white/5 last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{plan.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{plan.company}</p>
                  </div>
                  <span className="text-sm text-white/70 font-mono">₺{formatCurrency(plan.total_paid)}</span>
                  <div>
                    {plan.current_value !== null ? (
                      <>
                        <span className="text-sm text-white font-mono">₺{formatCurrency(plan.current_value)}</span>
                        {plan.last_updated && (
                          <p className="text-xs text-white/20 mt-0.5">{formatDate(plan.last_updated)}</p>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-white/20">—</span>
                    )}
                  </div>
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
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Update Prices", path: "/investments/price-update" },
              { label: "View Transactions", path: "/investments/transactions" },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center justify-between px-4 py-3 bg-[#0e0e18] border border-white/5 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
              >
                {label}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
