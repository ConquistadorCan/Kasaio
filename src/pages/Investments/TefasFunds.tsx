import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { investmentTransactionsApi } from "../../api/investmentTransactions";
import { holdingsApi } from "../../api/holdings";
import { logError } from "../../lib/logger";
import { formatCurrency } from "../../lib/formatters";
import { TransactionModal } from "../../components/investment/InvestmentTransactionModal";
import { IncomeTransactionModal } from "../../components/investment/IncomeTransactionModal";
import { PageHeader } from "../../components/ui/primitives";

const COLS = "1fr 120px 120px 120px 120px 120px 100px";
const CLOSED_COLS = "1fr 160px";

export function TefasFunds() {
  const { assets, holdings, latestPrices, investmentTransactions, addInvestmentTransaction, refreshHolding } = useInvestmentStore();
  const [showModal, setShowModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [prefillIncome, setPrefillIncome] = useState<{ assetId: number; quantity: number } | null>(null);
  const [mutating, setMutating] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const allTefasAssets = assets.filter((a) => a.asset_type === "TEFAS_FUND");
  const tefasAssets = allTefasAssets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity > 0));
  const closedTefasAssets = allTefasAssets.filter((a) => holdings.some((h) => h.asset_id === a.id && h.quantity === 0));

  const closedRows = closedTefasAssets.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const totalIncome = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const totalInvested = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "BUY").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const realizedPnl = (holding?.realized_pnl ?? 0) + totalIncome;
    const realizedPnlPct = totalInvested > 0 ? (realizedPnl / totalInvested) * 100 : null;
    return { asset, realizedPnl, realizedPnlPct };
  });

  const rows = tefasAssets.map((asset) => {
    const holding = holdings.find((h) => h.asset_id === asset.id);
    const latestPrice = latestPrices[asset.id]?.price ?? null;
    const currentValue = latestPrice !== null && holding ? latestPrice * holding.quantity : null;
    const costBasis = holding ? holding.average_cost * holding.quantity : null;
    const totalIncome = investmentTransactions.filter((t) => t.asset_id === asset.id && t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const realizedPnl = holding?.realized_pnl ?? 0;
    const extraPnl = totalIncome + realizedPnl;
    const pnl = currentValue !== null && costBasis !== null ? (currentValue - costBasis) + extraPnl : extraPnl !== 0 ? extraPnl : null;
    const pnlPct = pnl !== null && costBasis ? (pnl / costBasis) * 100 : null;
    return { asset, holding, latestPrice, currentValue, pnl, pnlPct };
  });

  async function handleAddIncome(data: { asset_id: number; transaction_type: "INCOME"; quantity: number; price: number; date: string }): Promise<string | undefined> {
    setMutating(true);
    try {
      const txn = await investmentTransactionsApi.create({ ...data, date: new Date(data.date).toISOString() });
      addInvestmentTransaction(txn);
      setShowIncomeModal(false);
      setPrefillIncome(null);
    } catch (err) {
      await logError("Failed to record income", err);
      return "Failed to record income. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleAddTransaction(data: { asset_id: number; transaction_type: "BUY" | "SELL"; quantity: number; price: number; date: string }): Promise<string | undefined> {
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

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PageHeader
        title="TEFAS Funds"
        meta={`${tefasAssets.length} assets`}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> New Transaction
          </button>
        }
      />

      <div className="surface" style={{ flex: 1, overflow: "hidden" }}>
        <div className="table-head" style={{ gridTemplateColumns: COLS }}>
          {["Fund", "Qty", "Avg Cost", "Price", "Value", "P&L", ""].map((col) => (
            <span key={col}>{col}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No TEFAS funds found</p>
          </div>
        ) : (
          rows.map(({ asset, holding, latestPrice, currentValue, pnl, pnlPct }) => (
            <div key={asset.id} className="table-row" style={{ gridTemplateColumns: COLS }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)" }}>{asset.name}</p>
                <p style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 1 }}>{asset.symbol}</p>
              </div>
              <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{holding ? holding.quantity.toFixed(2) : "—"}</span>
              <span className="num" style={{ fontSize: 13, color: "var(--fg-2)" }}>{holding ? `₺${formatCurrency(holding.average_cost)}` : "—"}</span>
              <span className="num" style={{ fontSize: 13, color: "var(--fg)" }}>{latestPrice !== null ? `₺${formatCurrency(latestPrice)}` : "—"}</span>
              <span className="num" style={{ fontSize: 13, color: "var(--fg)" }}>{currentValue !== null ? `₺${formatCurrency(currentValue)}` : "—"}</span>
              <div>
                {pnl !== null ? (
                  <>
                    <p className="num" style={{ fontSize: 13, fontWeight: 500, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(pnl))}
                    </p>
                    <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: pnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
                      {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                    </p>
                  </>
                ) : <span style={{ fontSize: 13, color: "var(--fg-5)" }}>—</span>}
              </div>
              <div>
                <button
                  onClick={() => { setPrefillIncome({ assetId: asset.id, quantity: holding?.quantity ?? 0 }); setShowIncomeModal(true); }}
                  style={{ fontSize: 11, padding: "3px 8px", borderRadius: "var(--r-1)", fontWeight: 500, border: "none", cursor: "pointer", background: "var(--warning-bg)", color: "var(--warning)" }}
                >
                  Record Income
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {closedRows.length > 0 && (
        <div>
          <button
            onClick={() => setShowClosed((p) => !p)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ChevronDown size={14} style={{ transform: showClosed ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
            Closed Positions ({closedRows.length})
          </button>
          {showClosed && (
            <div className="surface" style={{ overflow: "hidden", marginTop: 8 }}>
              <div className="table-head" style={{ gridTemplateColumns: CLOSED_COLS }}>
                {["Fund", "Realized P&L"].map((col) => <span key={col}>{col}</span>)}
              </div>
              {closedRows.map(({ asset, realizedPnl, realizedPnlPct }) => (
                <div key={asset.id} className="table-row" style={{ gridTemplateColumns: CLOSED_COLS }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}>{asset.name}</p>
                    <p style={{ fontSize: 11, color: "var(--fg-5)", marginTop: 1 }}>{asset.symbol}</p>
                  </div>
                  <div>
                    <p className="num" style={{ fontSize: 13, fontWeight: 500, color: realizedPnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {realizedPnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(realizedPnl))}
                    </p>
                    {realizedPnlPct !== null && (
                      <p className="num" style={{ fontSize: 10.5, marginTop: 1, color: realizedPnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.6 }}>
                        {realizedPnl >= 0 ? "+" : ""}{realizedPnlPct.toFixed(2)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <TransactionModal mode="add" assets={allTefasAssets} holdings={holdings} onSubmit={handleAddTransaction} onClose={() => setShowModal(false)} loading={mutating} />
      )}
      {showIncomeModal && (
        <IncomeTransactionModal onSubmit={handleAddIncome} onClose={() => { setShowIncomeModal(false); setPrefillIncome(null); }} loading={mutating}
          prefillAssetId={prefillIncome?.assetId} prefillQuantity={prefillIncome?.quantity}
        />
      )}
    </div>
  );
}
