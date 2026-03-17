import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";

export function InvestmentsPortfolio() {
  const { assets, holdings, latestPrices } = useInvestmentStore();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    return holdings.map((h) => {
      const asset = assets.find((a) => a.id === h.asset_id);
      const latestPrice = latestPrices[h.asset_id]?.price ?? null;
      const currentValue = latestPrice !== null ? latestPrice * h.quantity : null;
      const costBasis = h.average_cost * h.quantity;
      const pnl = currentValue !== null ? currentValue - costBasis : null;
      const pnlPct = pnl !== null && costBasis > 0 ? (pnl / costBasis) * 100 : null;
      return { asset, holding: h, latestPrice, currentValue, costBasis, pnl, pnlPct };
    });
  }, [holdings, assets, latestPrices]);

  const totalValue = useMemo(
    () => rows.reduce((sum, r) => sum + (r.currentValue ?? r.costBasis), 0),
    [rows]
  );

  const totalCost = useMemo(
    () => rows.reduce((sum, r) => sum + r.costBasis, 0),
    [rows]
  );

  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isProfit = totalPnl >= 0;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Portfolio</h1>
        <p className="text-sm text-white/40 mt-0.5">{holdings.length} positions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-white/30 mb-2">Total Value</p>
          <p className="text-2xl font-semibold text-white font-mono">
            ₺{formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-white/30 mb-2">Total Cost</p>
          <p className="text-2xl font-semibold text-white/70 font-mono">
            ₺{formatCurrency(totalCost)}
          </p>
        </div>
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
          <p className="text-xs text-white/30 mb-2">P&L</p>
          <div className="flex items-center gap-2">
            <p className={cn("text-2xl font-semibold font-mono", isProfit ? "text-emerald-400" : "text-red-400")}>
              {isProfit ? "+" : ""}₺{formatCurrency(Math.abs(totalPnl))}
            </p>
            {isProfit ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
          </div>
          <p className={cn("text-xs mt-1 font-mono", isProfit ? "text-emerald-400/60" : "text-red-400/60")}>
            {isProfit ? "+" : ""}{totalPnlPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Holdings table */}
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_120px_120px_120px] px-5 py-3 border-b border-white/5">
          {["Asset", "Qty", "Avg Cost", "Current", "P&L"].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-white/20">No positions yet</p>
          </div>
        ) : (
          rows.map(({ asset, holding, currentValue, pnl, pnlPct }) => (
            <div
              key={holding.id}
              className="grid grid-cols-[1fr_100px_120px_120px_120px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div>
                <p className="text-sm font-medium text-white">{asset?.name ?? "—"}</p>
                <p className="text-xs text-white/30 mt-0.5">{asset?.symbol ?? "—"}</p>
              </div>
              <span className="text-sm text-white/70 font-mono">{holding.quantity.toFixed(2)}</span>
              <span className="text-sm text-white/70 font-mono">₺{formatCurrency(holding.average_cost)}</span>
              <span className="text-sm text-white font-mono">
                {currentValue !== null ? `₺${formatCurrency(currentValue)}` : "—"}
              </span>
              <div>
                {pnl !== null ? (
                  <>
                    <p className={cn("text-sm font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(pnl))}
                    </p>
                    <p className={cn("text-xs font-mono mt-0.5", pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                      {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                    </p>
                  </>
                ) : (
                  <span className="text-sm text-white/20">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "View Commodities", path: "/investments/commodities" },
          { label: "Update Prices", path: "/investments/price-update" },
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
    </div>
  );
}