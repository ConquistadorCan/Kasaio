import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { useBESStore } from "../store/useBESStore";
import { useUIStore } from "../store/useUIStore";
import { formatCurrency, formatDateShort } from "../lib/formatters";

type WalletView = "TRY" | "USD";
type AllocationView = "TRY" | "USD" | "Combined";

function getLast6Months(): { key: string; label: string }[] {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    });
  }
  return months;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  symbol?: string;
}

function CustomTooltip({ active, payload, label, symbol = "₺" }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141422] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={p.name === "income" ? "text-emerald-400" : "text-red-400"}>
          {p.name === "income" ? "Income" : "Expense"}: {symbol}{formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  COMMODITY: "#fbbf24",
  CRYPTOCURRENCY: "#f87171",
  TEFAS_FUND: "#7c5cfc",
  ETF: "#60a5fa",
  EUROBOND: "#34d399",
  BES: "#a78bfa",
};
const ASSET_TYPE_LABELS: Record<string, string> = {
  COMMODITY: "Commodity",
  CRYPTOCURRENCY: "Crypto",
  TEFAS_FUND: "TEFAS",
  ETF: "ETF",
  EUROBOND: "Eurobond",
  BES: "BES",
};

export function Dashboard() {
  const navigate = useNavigate();
  const { transactions, categories } = useAppStore();
  const { assets, holdings, latestPrices, investmentTransactions } = useInvestmentStore();
  const { plans: besPlans } = useBESStore();
  const walletView = useUIStore((s) => s.walletView) as WalletView;
  const [allocationView, setAllocationView] = useState<AllocationView>("TRY");
  const [usdRate, setUsdRate] = useState<number>(38);
  const [usdRateInput, setUsdRateInput] = useState<string>("38");

  const sym = walletView === "USD" ? "$" : "₺";

  // ── Wallet-filtered data ────────────────────────────────────────────────────
  const walletTxns = useMemo(
    () => transactions.filter((t) => t.currency === walletView),
    [transactions, walletView]
  );

  const walletAssets = useMemo(
    () => assets.filter((a) => a.currency === walletView),
    [assets, walletView]
  );

  const walletHoldings = useMemo(
    () => holdings.filter((h) => walletAssets.some((a) => a.id === h.asset_id)),
    [holdings, walletAssets]
  );

  const walletInvestmentTxns = useMemo(
    () => investmentTransactions.filter((t) => walletAssets.some((a) => a.id === t.asset_id)),
    [investmentTransactions, walletAssets]
  );

  // ── Cash Flow ───────────────────────────────────────────────────────────────
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const txnIncome = walletTxns.filter((t) => t.type.toLowerCase() === "income").reduce((sum, t) => sum + t.amount, 0);
    const txnExpense = walletTxns.filter((t) => t.type.toLowerCase() === "expense").reduce((sum, t) => sum + t.amount, 0);
    const invIncome = walletInvestmentTxns.filter((t) => t.transaction_type === "SELL" || t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const invExpense = walletInvestmentTxns.filter((t) => t.transaction_type === "BUY").reduce((sum, t) => sum + t.quantity * t.price, 0);
    const totalIncome = txnIncome + invIncome;
    const totalExpense = txnExpense + invExpense;
    return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }, [walletTxns, walletInvestmentTxns]);

  // ── Portfolio ───────────────────────────────────────────────────────────────
  const { portfolioValue, portfolioPnl, portfolioPnlPct } = useMemo(() => {
    const activeHoldings = walletHoldings.filter((h) => h.quantity > 0);
    const holdingsValue = activeHoldings.reduce((sum, h) => {
      const price = latestPrices[h.asset_id]?.price ?? h.average_cost;
      return sum + price * h.quantity;
    }, 0);
    const portfolioCost = activeHoldings.reduce((sum, h) => sum + h.average_cost * h.quantity, 0);
    const portfolioRealizedPnl = walletHoldings.reduce((sum, h) => sum + (h.realized_pnl ?? 0), 0);
    const portfolioIncome = walletInvestmentTxns
      .filter((t) => t.transaction_type === "INCOME")
      .reduce((sum, t) => sum + t.quantity * t.price, 0);

    // BES is always TRY — only include when viewing TRY wallet
    const besValue = walletView === "TRY"
      ? besPlans.reduce((sum, p) => sum + (p.current_value ?? 0), 0)
      : 0;
    const besCost = walletView === "TRY"
      ? besPlans.reduce((sum, p) => sum + p.total_paid, 0)
      : 0;

    const portfolioValue = holdingsValue + besValue;
    const totalCost = portfolioCost + besCost;
    const portfolioPnl = (holdingsValue - portfolioCost) + portfolioRealizedPnl + portfolioIncome + (besValue - besCost);
    const portfolioPnlPct = totalCost > 0 ? (portfolioPnl / totalCost) * 100 : 0;
    return { portfolioValue, portfolioPnl, portfolioPnlPct };
  }, [walletHoldings, walletInvestmentTxns, latestPrices, besPlans, walletView]);

  const walletTotal = netBalance + portfolioValue;

  // ── Monthly chart ───────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return getLast6Months().map(({ key, label }) => {
      const monthTxns = walletTxns.filter((t) => t.date.startsWith(key));
      const monthInvTxns = walletInvestmentTxns.filter((t) => t.date.startsWith(key));
      const income = monthTxns.filter((t) => t.type.toLowerCase() === "income").reduce((sum, t) => sum + t.amount, 0)
        + monthInvTxns.filter((t) => t.transaction_type === "SELL" || t.transaction_type === "INCOME").reduce((sum, t) => sum + t.quantity * t.price, 0);
      const expense = monthTxns.filter((t) => t.type.toLowerCase() === "expense").reduce((sum, t) => sum + t.amount, 0)
        + monthInvTxns.filter((t) => t.transaction_type === "BUY").reduce((sum, t) => sum + t.quantity * t.price, 0);
      return { label, income, expense };
    });
  }, [walletTxns, walletInvestmentTxns]);

  // ── Category breakdown ──────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    if (categories.length === 0) return [];
    const expenses = walletTxns.filter((t) => t.type.toLowerCase() === "expense" && t.category_id);
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    return categories.map((cat) => {
      const amount = expenses.filter((t) => t.category_id === cat.id).reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
    }).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [walletTxns, categories]);

  // ── Asset allocation by type ────────────────────────────────────────────────
  const tryTypeAllocation = useMemo(() => {
    const tryAssets = assets.filter((a) => a.currency === "TRY");
    const grouped: Record<string, number> = {};
    for (const h of holdings.filter((h) => tryAssets.some((a) => a.id === h.asset_id) && h.quantity > 0)) {
      const asset = tryAssets.find((a) => a.id === h.asset_id)!;
      const price = latestPrices[h.asset_id]?.price ?? h.average_cost;
      grouped[asset.asset_type] = (grouped[asset.asset_type] ?? 0) + price * h.quantity;
    }
    const besValue = besPlans.reduce((s, p) => s + (p.current_value ?? p.total_paid), 0);
    if (besValue > 0) grouped["BES"] = besValue;
    return Object.entries(grouped)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ key, name: ASSET_TYPE_LABELS[key] ?? key, value, color: ASSET_TYPE_COLORS[key] ?? "#7c5cfc" }))
      .sort((a, b) => b.value - a.value);
  }, [assets, holdings, latestPrices, besPlans]);

  const usdTypeAllocation = useMemo(() => {
    const usdAssets = assets.filter((a) => a.currency === "USD");
    const grouped: Record<string, number> = {};
    for (const h of holdings.filter((h) => usdAssets.some((a) => a.id === h.asset_id) && h.quantity > 0)) {
      const asset = usdAssets.find((a) => a.id === h.asset_id)!;
      const price = latestPrices[h.asset_id]?.price ?? h.average_cost;
      grouped[asset.asset_type] = (grouped[asset.asset_type] ?? 0) + price * h.quantity;
    }
    return Object.entries(grouped)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({ key, name: ASSET_TYPE_LABELS[key] ?? key, value, color: ASSET_TYPE_COLORS[key] ?? "#7c5cfc" }))
      .sort((a, b) => b.value - a.value);
  }, [assets, holdings, latestPrices]);

  const combinedTypeAllocation = useMemo(() => {
    const merged: Record<string, { key: string; name: string; value: number; color: string }> = {};
    for (const s of tryTypeAllocation) merged[s.key] = { ...s };
    for (const s of usdTypeAllocation) {
      const converted = s.value * usdRate;
      if (merged[s.key]) merged[s.key].value += converted;
      else merged[s.key] = { ...s, value: converted };
    }
    return Object.values(merged).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  }, [tryTypeAllocation, usdTypeAllocation, usdRate]);

  const activeAllocation =
    allocationView === "TRY" ? tryTypeAllocation
    : allocationView === "USD" ? usdTypeAllocation
    : combinedTypeAllocation;
  const allocationTotal = activeAllocation.reduce((s, a) => s + a.value, 0);

  // ── BES rows (TRY only) ─────────────────────────────────────────────────────
  const besRows = useMemo(() => {
    if (walletView !== "TRY") return [];
    return besPlans.filter((p) => p.current_value !== null || p.total_paid > 0);
  }, [besPlans, walletView]);

  // ── Holdings rows ───────────────────────────────────────────────────────────
  const holdingRows = useMemo(() => {
    return walletHoldings
      .filter((h) => h.quantity > 0)
      .map((h) => {
        const asset = walletAssets.find((a) => a.id === h.asset_id);
        const price = latestPrices[h.asset_id]?.price ?? null;
        const currentValue = price !== null ? price * h.quantity : null;
        const costBasis = h.average_cost * h.quantity;
        const realizedPnl = h.realized_pnl ?? 0;
        const totalIncome = walletInvestmentTxns
          .filter((t) => t.asset_id === h.asset_id && t.transaction_type === "INCOME")
          .reduce((sum, t) => sum + t.quantity * t.price, 0);
        const pnl = currentValue !== null
          ? (currentValue - costBasis) + realizedPnl + totalIncome
          : (realizedPnl + totalIncome) !== 0 ? (realizedPnl + totalIncome) : null;
        const pnlPct = pnl !== null && costBasis > 0 ? (pnl / costBasis) * 100 : null;
        return { asset, holding: h, price, currentValue, pnl, pnlPct };
      });
  }, [walletHoldings, walletAssets, walletInvestmentTxns, latestPrices]);

  // ── Recent ──────────────────────────────────────────────────────────────────
  const recentCashFlow = useMemo(() => {
    const invRows = walletInvestmentTxns.map((t) => {
      const asset = walletAssets.find((a) => a.id === t.asset_id);
      const label = t.transaction_type === "BUY" ? "Buy" : t.transaction_type === "SELL" ? "Sale" : "Income";
      return {
        id: 2_000_000 + t.id,
        description: `${label}: ${asset?.name ?? ""}`,
        type: (t.transaction_type === "BUY" ? "expense" : "income") as "income" | "expense",
        currency: (asset?.currency ?? walletView) as "TRY" | "USD",
        category_id: null,
        amount: t.quantity * t.price,
        date: t.date,
      };
    });
    return [...walletTxns, ...invRows]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [walletTxns, walletInvestmentTxns, walletAssets, walletView]);

  const recentInvestments = useMemo(
    () => [...walletInvestmentTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [walletInvestmentTxns]
  );

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 24 }}>

      {/* ── Overview KPIs ── */}

      {/* KPI row */}
      <div className="surface" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { label: "Cash Balance",  value: `${sym}${formatCurrency(netBalance)}`,   tone: netBalance >= 0 ? "pos" : "neg" },
          { label: "Portfolio",     value: `${sym}${formatCurrency(portfolioValue)}`, hint: `${portfolioPnl >= 0 ? "+" : ""}${portfolioPnlPct.toFixed(2)}%`, hintTone: portfolioPnl >= 0 ? "pos" : "neg" },
          { label: "Total Assets",  value: `${sym}${formatCurrency(walletTotal)}`,    tone: "" },
        ].map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</span>
            <div className="num" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: k.tone === "pos" ? "var(--success)" : k.tone === "neg" ? "var(--danger)" : "var(--fg)" }}>
              {k.value}
            </div>
            {k.hint && (
              <span className={`pill pill-sm ${k.hintTone === "pos" ? "pos-bg" : "neg-bg"}`} style={{ marginTop: 4 }}>{k.hint}</span>
            )}
          </div>
        ))}
      </div>

      {/* Cash flow: income / expense + monthly bars + category breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 14 }}>

        {/* Monthly bars panel */}
        <div className="surface">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderBottom: "1px solid var(--line)",
          }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>TREND</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Last 6 months</span>
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--fg-3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: "var(--success)" }}/>Income</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="dot" style={{ background: "var(--danger)" }}/>Expense</span>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {walletTxns.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100 }}>
                <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No {walletView} transactions yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={132}>
                <BarChart data={monthlyData} barSize={9} barGap={3}>
                  <XAxis dataKey="label" tick={{ fill: "var(--fg-4)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip symbol={sym} />} cursor={{ fill: "oklch(1 0 0 / 0.03)" }} />
                  <Bar dataKey="income" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill="var(--success)" opacity={0.9} />)}
                  </Bar>
                  <Bar dataKey="expense" radius={[3, 3, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill="var(--danger)" opacity={0.9} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Income / Expense totals */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--line)" }}>
            {[
              { label: "Income", value: `+${sym}${formatCurrency(totalIncome)}`, color: "var(--success)" },
              { label: "Expenses", value: `−${sym}${formatCurrency(totalExpense)}`, color: "var(--danger)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "10px 14px", borderRight: i === 0 ? "1px solid var(--line)" : "none" }}>
                <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                <div className="num" style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="surface">
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
            <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>By Category</span>
          </div>
          <div style={{ padding: "6px 0" }}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ padding: "20px 14px", textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--fg-4)" }}>No categorized expenses</p>
              </div>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.name} style={{ padding: "6px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</span>
                    <span className="num" style={{ fontSize: 10.5, color: "var(--fg-4)", flexShrink: 0, marginLeft: 4 }}>{cat.percentage.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 3, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${cat.percentage}%`, height: "100%", background: "var(--accent)", opacity: 0.8 }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent cash flow */}
      <div className="surface" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Recent Transactions</span>
          <button
            onClick={() => navigate("/cash-flow/transactions")}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent-2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recentCashFlow.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No transactions yet</p>
          </div>
        ) : (
          recentCashFlow.map((t) => (
            <div key={t.id} className="table-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="dot" style={{ background: t.type.toLowerCase() === "income" ? "var(--success)" : "var(--danger)" }} />
                <div>
                  <p style={{ fontSize: 12.5, color: "var(--fg)", margin: 0 }}>{t.description ?? "—"}</p>
                  <p className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", margin: 0 }}>{formatDateShort(t.date)}</p>
                </div>
              </div>
              <span className="num" style={{ fontSize: 12.5, fontWeight: 500, color: t.type.toLowerCase() === "income" ? "var(--success)" : "var(--danger)" }}>
                {t.type.toLowerCase() === "income" ? "+" : "−"}{sym}{formatCurrency(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Portfolio section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Allocation donut */}
        <div className="surface">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Allocation</span>
            <div style={{ display: "inline-flex", padding: 2, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 6, gap: 1 }}>
              {(["TRY", "USD", "Combined"] as AllocationView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setAllocationView(v)}
                  style={{
                    border: 0, cursor: "pointer",
                    padding: "3px 8px", fontSize: 11, fontWeight: 500, borderRadius: 4,
                    color: allocationView === v ? "var(--fg)" : "var(--fg-3)",
                    background: allocationView === v ? "var(--bg-3)" : "transparent",
                    transition: "80ms", fontFamily: "inherit",
                  }}
                >
                  {v === "TRY" ? "₺ TRY" : v === "USD" ? "$ USD" : "Combined"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: 16 }}>
            {allocationView === "Combined" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: "var(--fg-3)" }}>
                <span>Rate: 1 $ =</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={usdRateInput}
                  onChange={(e) => setUsdRateInput(e.target.value)}
                  onBlur={() => {
                    const p = parseFloat(usdRateInput);
                    if (!isNaN(p) && p > 0) { setUsdRate(p); setUsdRateInput(p.toString()); }
                    else setUsdRateInput(usdRate.toString());
                  }}
                  style={{ width: 56, textAlign: "right" }}
                />
                <span>₺</span>
              </div>
            )}
            {activeAllocation.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80 }}>
                <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No positions</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={activeAllocation} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46} strokeWidth={0}>
                      {activeAllocation.map((s) => <Cell key={s.key} fill={s.color} opacity={0.9} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  {activeAllocation.map((s) => {
                    const pct = allocationTotal > 0 ? (s.value / allocationTotal) * 100 : 0;
                    return (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: s.color }} />
                        <span style={{ fontSize: 11.5, color: "var(--fg-2)", width: 60, flexShrink: 0 }}>{s.name}</span>
                        <div style={{ flex: 1, height: 3, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 2 }} />
                        </div>
                        <span className="num" style={{ fontSize: 10.5, color: "var(--fg-4)", width: 34, textAlign: "right", flexShrink: 0 }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Holdings mini-table */}
        <div className="surface" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Holdings</span>
            <button
              onClick={() => navigate("/investments/portfolio")}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent-2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="table-head table-row" style={{ gridTemplateColumns: "1fr 80px 90px 80px" }}>
            {["Asset", "Qty", "Value", "P&L"].map((h) => <span key={h}>{h}</span>)}
          </div>
          {holdingRows.length === 0 && besRows.length === 0 ? (
            <div style={{ padding: "24px 14px", textAlign: "center" }}>
              <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No positions yet</p>
            </div>
          ) : (
            <>
              {holdingRows.map(({ asset, holding, currentValue, pnl, pnlPct }) => (
                <div key={holding.id} className="table-row" style={{ gridTemplateColumns: "1fr 80px 90px 80px" }}>
                  <div>
                    <p style={{ fontSize: 12.5, color: "var(--fg)", margin: 0 }}>{asset?.name ?? "—"}</p>
                    <p className="mono" style={{ fontSize: 10, color: "var(--fg-4)", margin: 0 }}>{asset?.symbol ?? "—"}</p>
                  </div>
                  <span className="num" style={{ fontSize: 12, color: "var(--fg-3)" }}>{holding.quantity.toFixed(2)}</span>
                  <span className="num" style={{ fontSize: 12, color: "var(--fg)" }}>{currentValue !== null ? `${sym}${formatCurrency(currentValue)}` : "—"}</span>
                  <div>
                    {pnl !== null ? (
                      <>
                        <p className="num" style={{ fontSize: 11.5, fontWeight: 600, margin: 0, color: pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                        </p>
                        <p className="num" style={{ fontSize: 10, margin: 0, color: pnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.7 }}>
                          {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                        </p>
                      </>
                    ) : <span style={{ color: "var(--fg-4)" }}>—</span>}
                  </div>
                </div>
              ))}
              {besRows.map((plan) => (
                <div key={`bes-${plan.id}`} className="table-row" style={{ gridTemplateColumns: "1fr 80px 90px 80px" }}>
                  <div>
                    <p style={{ fontSize: 12.5, color: "var(--fg)", margin: 0 }}>{plan.name}</p>
                    <p className="mono" style={{ fontSize: 10, color: "var(--fg-4)", margin: 0 }}>BES · {plan.company}</p>
                  </div>
                  <span style={{ color: "var(--fg-4)" }}>—</span>
                  <span className="num" style={{ fontSize: 12, color: "var(--fg)" }}>{plan.current_value !== null ? `₺${formatCurrency(plan.current_value)}` : "—"}</span>
                  <div>
                    {plan.pnl !== null ? (
                      <>
                        <p className="num" style={{ fontSize: 11.5, fontWeight: 600, margin: 0, color: plan.pnl >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {plan.pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(plan.pnl))}
                        </p>
                        <p className="num" style={{ fontSize: 10, margin: 0, color: plan.pnl >= 0 ? "var(--success)" : "var(--danger)", opacity: 0.7 }}>
                          {plan.pnl >= 0 ? "+" : ""}{plan.pnl_pct?.toFixed(2)}%
                        </p>
                      </>
                    ) : <span style={{ color: "var(--fg-4)" }}>—</span>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Recent investment transactions */}
      <div className="surface" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Recent Investment Transactions</span>
          <button
            onClick={() => navigate("/investments/transactions")}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--accent-2)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            View all <ArrowRight size={12} />
          </button>
        </div>
        {recentInvestments.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No investment transactions yet</p>
          </div>
        ) : (
          recentInvestments.map((t) => {
            const asset = walletAssets.find((a) => a.id === t.asset_id);
            const isBuy = t.transaction_type === "BUY";
            return (
              <div key={t.id} className="table-row" style={{ gridTemplateColumns: "1fr auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="dot" style={{ background: isBuy ? "var(--success)" : "var(--danger)" }} />
                  <div>
                    <p style={{ fontSize: 12.5, color: "var(--fg)", margin: 0 }}>{asset?.name ?? "—"}</p>
                    <p className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", margin: 0 }}>{formatDateShort(t.date)}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="num" style={{ fontSize: 12.5, fontWeight: 500, margin: 0, color: isBuy ? "var(--success)" : "var(--danger)" }}>
                    {isBuy ? "+" : "−"}{t.quantity.toFixed(2)}
                  </p>
                  <p className="num" style={{ fontSize: 10.5, color: "var(--fg-4)", margin: 0 }}>{sym}{formatCurrency(t.price)}/unit</p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
