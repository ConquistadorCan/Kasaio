import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, RefreshCw } from "lucide-react";
import { portfolioApi } from "../../api/portfolioApi";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { useBESStore } from "../../store/useBESStore";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { logError } from "../../lib/logger";
import { LoadingState, ErrorState } from "../../components/ui/ErrorComponents";
import { PageHeader } from "../../components/ui/primitives";
import type { PortfolioSummary } from "../../types/investments";

const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: "Commodity",
  CRYPTOCURRENCY: "Crypto",
  TEFAS_FUND: "TEFAS",
  ETF: "ETF",
  EUROBOND: "Eurobond",
};

const FILTER_CHIPS = [
  { label: "All", path: "/investments/portfolio" },
  { label: "Commodities", path: "/investments/commodities" },
  { label: "Crypto", path: "/investments/crypto" },
  { label: "TEFAS", path: "/investments/tefas-funds" },
  { label: "ETF", path: "/investments/etf" },
];

const COLS = "1fr 80px 80px 100px 120px 120px 130px";
const CLOSED_COLS = "1fr 80px 80px 160px";
const BES_COLS = "1fr 130px 130px 130px";

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

  const activeCount = summary?.holdings.filter((h) => h.quantity > 0).length ?? 0;

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="Holdings"
        meta={`${activeCount} positions`}
        actions={
          <button className="btn btn-ghost" onClick={() => navigate("/investments/price-update")}>
            <RefreshCw size={13} /> Update Prices
          </button>
        }
      />

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6 }}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = chip.path === "/investments/portfolio";
          return (
            <button
              key={chip.path}
              onClick={() => navigate(chip.path)}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--r-2)",
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid",
                transition: "all 80ms",
                borderColor: isActive ? "var(--accent-line)" : "var(--line)",
                background: isActive ? "var(--accent-bg)" : "transparent",
                color: isActive ? "var(--accent-2)" : "var(--fg-4)",
                cursor: "pointer",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingState />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchSummary} />
      ) : (
        <>
          {/* Holdings table */}
          <div className="surface" style={{ overflow: "hidden" }}>
            <div
              className="table-head"
              style={{ gridTemplateColumns: COLS }}
            >
              {["Asset", "Type", "CCY", "Qty", "Avg Cost", "Value", "P&L"].map((col) => (
                <span key={col}>{col}</span>
              ))}
            </div>

            {!summary || summary.holdings.filter((h) => h.quantity > 0).length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
                <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No positions yet</p>
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
                    className="table-row"
                    style={{ gridTemplateColumns: COLS }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{h.asset.name}</p>
                      <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{h.asset.symbol}</p>
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                      {ASSET_TYPE_LABELS[h.asset.asset_type] ?? h.asset.asset_type}
                    </span>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-4)" }}>{h.asset.currency}</span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{h.quantity.toFixed(2)}</span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>
                      {sym}{formatCurrency(h.average_cost)}
                    </span>
                    <span className="num" style={{ fontSize: 13, color: "var(--fg)" }}>
                      {h.current_value != null ? `${sym}${formatCurrency(h.current_value)}` : "—"}
                    </span>
                    <div>
                      {pnl != null ? (
                        <>
                          <p className="num" style={{ fontSize: 13, fontWeight: 500, color: isProfit ? "var(--success)" : "var(--danger)" }}>
                            {isProfit ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                          </p>
                          {pnlPct != null && (
                            <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: isProfit ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
                              {isProfit ? "+" : ""}{pnlPct.toFixed(2)}%
                            </p>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>
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
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <ChevronDown size={14} style={{ transform: showClosed ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
                  Closed Positions ({closed.length})
                </button>
                {showClosed && (
                  <div className="surface" style={{ overflow: "hidden", marginTop: 8 }}>
                    <div className="table-head" style={{ gridTemplateColumns: CLOSED_COLS }}>
                      {["Asset", "Type", "CCY", "Realized P&L"].map((col) => (
                        <span key={col}>{col}</span>
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
                        <div key={h.asset.id} className="table-row" style={{ gridTemplateColumns: CLOSED_COLS }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}>{h.asset.name}</p>
                            <p style={{ fontSize: 11, color: "var(--fg-5)", marginTop: 1 }}>{h.asset.symbol}</p>
                          </div>
                          <span style={{ fontSize: 11.5, color: "var(--fg-4)" }}>
                            {ASSET_TYPE_LABELS[h.asset.asset_type] ?? h.asset.asset_type}
                          </span>
                          <span className="mono" style={{ fontSize: 11.5, color: "var(--fg-4)" }}>{h.asset.currency}</span>
                          <div>
                            <p className="num" style={{ fontSize: 13, fontWeight: 500, color: isProfit ? "var(--success)" : "var(--danger)" }}>
                              {isProfit ? "+" : ""}{sym}{formatCurrency(Math.abs(realizedPnl))}
                            </p>
                            {realizedPnlPct !== null && (
                              <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: isProfit ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
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
            <div className="surface" style={{ overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10.5, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>BES Plans</span>
                <button
                  onClick={() => navigate("/investments/bes")}
                  style={{ fontSize: 11.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent-2)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-4)")}
                >
                  Manage →
                </button>
              </div>
              <div className="table-head" style={{ gridTemplateColumns: BES_COLS }}>
                {["Plan", "Total Paid", "Current Value", "P&L"].map((col) => (
                  <span key={col}>{col}</span>
                ))}
              </div>
              {besPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="table-row"
                  style={{ gridTemplateColumns: BES_COLS }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{plan.name}</p>
                    <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{plan.company}</p>
                  </div>
                  <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>₺{formatCurrency(plan.total_paid)}</span>
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
                </div>
              ))}
            </div>
          )}

          {/* View transactions link */}
          <div>
            <button
              onClick={() => navigate("/investments/transactions")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", background: "var(--bg-2)", border: "1px solid var(--line)",
                borderRadius: "var(--r-3)", fontSize: 12.5, color: "var(--fg-4)",
                cursor: "pointer", width: "100%", transition: "color 80ms, border-color 80ms",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.borderColor = "var(--line-strong)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-4)"; e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              View Investment Transactions
              <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
