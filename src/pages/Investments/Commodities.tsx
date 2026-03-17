import { useInvestmentStore } from "../../store/useInvestmentStore";
import { formatCurrency } from "../../lib/formatters";
import { cn } from "../../lib/utils";

export function Commodities() {
  const { assets, holdings, latestPrices } = useInvestmentStore();

  const commodities = assets.filter((a) => a.asset_type === "COMMODITY");

  const rows = commodities.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const latestPrice = latestPrices[asset.id]?.price ?? null;
    const currentValue = holding && latestPrice !== null ? latestPrice * holding.quantity : null;
    const costBasis = holding ? holding.average_cost * holding.quantity : null;
    const pnl = currentValue !== null && costBasis !== null ? currentValue - costBasis : null;
    const pnlPct = pnl !== null && costBasis && costBasis > 0 ? (pnl / costBasis) * 100 : null;
    return { asset, holding, latestPrice, currentValue, pnl, pnlPct };
  });

  return (
    <div className="flex flex-col h-full gap-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Commodities</h1>
        <p className="text-sm text-white/40 mt-0.5">{commodities.length} assets</p>
      </div>

      <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-[1fr_90px_120px_120px_120px_120px] px-5 py-3 border-b border-white/5 shrink-0">
          {["Asset", "Qty (g)", "Avg Cost", "Price", "Value", "P&L"].map((col) => (
            <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
              {col}
            </span>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <p className="text-sm text-white/20">No commodities found</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {rows.map(({ asset, holding, latestPrice, currentValue, pnl, pnlPct }) => (
              <div
                key={asset.id}
                className="grid grid-cols-[1fr_90px_120px_120px_120px_120px] px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{asset.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">{asset.symbol}</p>
                </div>
                <span className="text-sm text-white/70 font-mono">
                  {holding ? holding.quantity.toFixed(2) : "—"}
                </span>
                <span className="text-sm text-white/70 font-mono">
                  {holding ? `₺${formatCurrency(holding.average_cost)}` : "—"}
                </span>
                <span className="text-sm text-white font-mono">
                  {latestPrice !== null ? `₺${formatCurrency(latestPrice)}` : "—"}
                </span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}