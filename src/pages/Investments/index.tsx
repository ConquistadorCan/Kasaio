import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { portfolioApi } from "../../api/portfolioApi";
import { formatCurrency } from "../../lib/formatters";
import { logError } from "../../lib/logger";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { cn } from "../../lib/utils";
import type { PortfolioSummary } from "../../types/investments";

type DisplayMode = "TRY" | "native";

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
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mode, setMode] = useState<DisplayMode>("TRY");

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

  const totalValue = mode === "TRY" ? summary?.total_current_value_try : null;
  const totalCost = mode === "TRY" ? summary?.total_cost_try : null;
  const totalPnl = mode === "TRY" ? summary?.total_pnl_try : null;
  const totalPnlPct = summary?.total_pnl_pct ?? null;
  const isProfit = (totalPnl ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Portfolio</h1>
          <p className="text-sm text-white/40 mt-0.5">{summary?.holdings.length ?? 0} positions</p>
        </div>

        {/* TRY / Native toggle */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {(["TRY", "native"] as DisplayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                mode === m ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {m === "TRY" ? "₺ TRY" : "Native"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchSummary} />
      ) : (
        <>
          {/* Stat cards — only shown in TRY mode since totals are TRY only */}
          {mode === "TRY" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
                <p className="text-xs text-white/30 mb-2">Total Value</p>
                <p className="text-2xl font-semibold text-white font-mono">
                  {totalValue != null ? `₺${formatCurrency(totalValue)}` : "—"}
                </p>
              </div>
              <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
                <p className="text-xs text-white/30 mb-2">Total Cost</p>
                <p className="text-2xl font-semibold text-white/70 font-mono">
                  {totalCost != null ? `₺${formatCurrency(totalCost)}` : "—"}
                </p>
              </div>
              <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
                <p className="text-xs text-white/30 mb-2">P&L</p>
                <div className="flex items-center gap-2">
                  <p className={cn("text-2xl font-semibold font-mono", isProfit ? "text-emerald-400" : "text-red-400")}>
                    {totalPnl != null
                      ? `${isProfit ? "+" : ""}₺${formatCurrency(Math.abs(totalPnl))}`
                      : "—"}
                  </p>
                  {totalPnl != null && (
                    isProfit
                      ? <TrendingUp size={16} className="text-emerald-400" />
                      : <TrendingDown size={16} className="text-red-400" />
                  )}
                </div>
                {totalPnlPct != null && (
                  <p className={cn("text-xs mt-1 font-mono", isProfit ? "text-emerald-400/60" : "text-red-400/60")}>
                    {isProfit ? "+" : ""}{totalPnlPct.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Holdings table */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_100px_120px_120px_130px] px-5 py-3 border-b border-white/5">
              {["Asset", "Type", "CCY", "Qty", "Avg Cost", "Value", "P&L"].map((col) => (
                <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                  {col}
                </span>
              ))}
            </div>

            {!summary || summary.holdings.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-sm text-white/20">No positions yet</p>
              </div>
            ) : (
              summary.holdings.map((h) => {
                const sym = mode === "TRY" ? "₺" : currencySymbol(h.asset.currency);
                const value = mode === "TRY" ? h.current_value_try : h.current_value;
                const avgCost = mode === "TRY"
                  ? (h.cost_basis_try != null && h.quantity > 0 ? h.cost_basis_try / h.quantity : null)
                  : h.average_cost;
                const pnl = mode === "TRY" ? h.pnl_try : h.pnl;
                const pnlPct = h.pnl_pct;

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
                      {avgCost != null ? `${sym}${formatCurrency(avgCost)}` : "—"}
                    </span>
                    <span className="text-sm text-white font-mono">
                      {value != null ? `${sym}${formatCurrency(value)}` : "—"}
                    </span>
                    <div>
                      {pnl != null ? (
                        <>
                          <p className={cn("text-sm font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                          </p>
                          {pnlPct != null && (
                            <p className={cn("text-xs font-mono mt-0.5", pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                              {pnl >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
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
