import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowRight, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { useBESStore } from "../store/useBESStore";
import { formatCurrency, formatDateShort } from "../lib/formatters";
import type { TransactionType } from "../types";
import { cn } from "../lib/utils";

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

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  variant: "income" | "expense" | "neutral" | "violet";
  symbol?: string;
}

function StatCard({ label, value, sub, subColor, icon, variant, symbol = "₺" }: StatCardProps) {
  const colors = {
    income: "text-emerald-400",
    expense: "text-red-400",
    neutral: "text-violet-400",
    violet: "text-violet-400",
  };
  return (
    <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        {sub ? (
          <span className={cn(
            "text-xs font-mono font-medium px-1.5 py-0.5 rounded-md",
            subColor === "text-emerald-400" ? "bg-emerald-500/10 text-emerald-400" :
            subColor === "text-red-400"     ? "bg-red-500/10 text-red-400" :
                                              "text-white/30"
          )}>
            {sub}
          </span>
        ) : (
          <span className={cn("opacity-60", colors[variant])}>{icon}</span>
        )}
      </div>
      <span className={cn("text-2xl font-semibold tracking-tight font-mono", colors[variant])}>
        {symbol}{value}
      </span>
    </div>
  );
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
  const [walletView, setWalletView] = useState<WalletView>("TRY");
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

  const TYPE_COLORS: Record<TransactionType, string> = { income: "#34d399", expense: "#f87171" };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-6">

      {/* ── Wallet toggle ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
          {(["TRY", "USD"] as WalletView[]).map((w) => (
            <button
              key={w}
              onClick={() => setWalletView(w)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                walletView === w ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
            >
              {w === "TRY" ? "₺ TRY" : "$ USD"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 1: Overview ── */}
      <div className="bg-[#141422] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-violet-400" />
          <p className="text-base font-semibold text-white">Overview</p>
        </div>
        <div className="flex gap-4">
          <StatCard label="Cash Balance" value={formatCurrency(netBalance)} symbol={sym} icon={<Wallet size={15} />} variant="neutral" />
          <StatCard
            label="Portfolio"
            value={formatCurrency(portfolioValue)}
            symbol={sym}
            sub={`${portfolioPnl >= 0 ? "+" : ""}${portfolioPnlPct.toFixed(2)}%`}
            subColor={portfolioPnl >= 0 ? "text-emerald-400" : "text-red-400"}
            icon={<BarChart2 size={15} />}
            variant="violet"
          />
          <StatCard label="Total" value={formatCurrency(walletTotal)} symbol={sym} icon={<Wallet size={15} />} variant="neutral" />
        </div>
      </div>

      {/* ── Section 2: Cash Flow ── */}
      <div className="bg-[#141422] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-violet-400" />
          <p className="text-base font-semibold text-white">Cash Flow</p>
        </div>
        <div className="flex gap-4 mb-4">
          <StatCard label="Total Income" value={formatCurrency(totalIncome)} symbol={sym} icon={<TrendingUp size={15} />} variant="income" />
          <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} symbol={sym} icon={<TrendingDown size={15} />} variant="expense" />
        </div>

        <div className="grid grid-cols-[1fr_220px] gap-4">
          {/* Bar chart */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
            <p className="text-sm font-medium text-white mb-1">Income vs Expenses</p>
            <p className="text-xs text-white/30 mb-4">Last 6 months · {walletView} wallet</p>
            {walletTxns.length === 0 ? (
              <div className="flex items-center justify-center h-36"><p className="text-sm text-white/20">No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} barSize={10} barGap={3}>
                  <XAxis dataKey="label" tick={{ fill: "rgba(240,240,250,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip symbol={sym} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill="#34d399" opacity={0.8} />)}
                  </Bar>
                  <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((_, i) => <Cell key={i} fill="#f87171" opacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
            <p className="text-sm font-medium text-white mb-1">By Category</p>
            <p className="text-xs text-white/30 mb-4">Expense breakdown</p>
            {categoryBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-36">
                <p className="text-xs text-white/20 text-center leading-relaxed">No categorized<br />expenses yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/60 truncate">{cat.name}</span>
                      <span className="text-xs text-white/40 font-mono ml-2 shrink-0">{cat.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${cat.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent cash flow */}
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden mt-4">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <p className="text-sm font-medium text-white">Recent Transactions</p>
            <button onClick={() => navigate("/cash-flow/transactions")} className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentCashFlow.length === 0 ? (
            <div className="flex items-center justify-center py-8"><p className="text-sm text-white/20">No transactions yet</p></div>
          ) : (
            recentCashFlow.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[t.type.toLowerCase() as TransactionType] }} />
                  <div>
                    <p className="text-sm text-white">{t.description ?? "—"}</p>
                    <p className="text-xs text-white/30">{formatDateShort(t.date)}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-medium font-mono", t.type.toLowerCase() === "income" ? "text-emerald-400" : "text-red-400")}>
                  {t.type.toLowerCase() === "income" ? "+" : "−"}{sym}{formatCurrency(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Section 3: Portfolio ── */}
      <div className="bg-[#141422] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-emerald-400" />
          <p className="text-base font-semibold text-white">Portfolio · {walletView}</p>
        </div>

        {/* Allocation by type */}
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-white">Allocation</p>
            <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-md">
              {(["TRY", "USD", "Combined"] as AllocationView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setAllocationView(v)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                    allocationView === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  {v === "TRY" ? "₺ TRY" : v === "USD" ? "$ USD" : "Combined"}
                </button>
              ))}
            </div>
          </div>

          {allocationView === "Combined" && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-white/40">Rate: 1 $ =</span>
              <input
                type="text"
                inputMode="decimal"
                value={usdRateInput}
                onChange={(e) => setUsdRateInput(e.target.value)}
                onBlur={() => {
                  const parsed = parseFloat(usdRateInput);
                  if (!isNaN(parsed) && parsed > 0) { setUsdRate(parsed); setUsdRateInput(parsed.toString()); }
                  else setUsdRateInput(usdRate.toString());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const parsed = parseFloat(usdRateInput);
                    if (!isNaN(parsed) && parsed > 0) { setUsdRate(parsed); setUsdRateInput(parsed.toString()); }
                    else setUsdRateInput(usdRate.toString());
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white font-mono outline-none text-right"
              />
              <span className="text-xs text-white/40">₺</span>
            </div>
          )}

          {activeAllocation.length === 0 ? (
            <div className="flex items-center justify-center h-16"><p className="text-xs text-white/20">No positions</p></div>
          ) : (
            <div className="flex gap-5 items-center">
              <div className="shrink-0">
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={activeAllocation} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} strokeWidth={0}>
                      {activeAllocation.map((s) => <Cell key={s.key} fill={s.color} opacity={0.9} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {activeAllocation.map((s) => {
                  const pct = allocationTotal > 0 ? (s.value / allocationTotal) * 100 : 0;
                  return (
                    <div key={s.key} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-white/60 w-20 shrink-0">{s.name}</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                      </div>
                      <span className="text-xs text-white/50 font-mono w-10 text-right shrink-0">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Holdings table */}
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-[1fr_90px_100px_110px] px-5 py-3 border-b border-white/5">
              {["Asset", "Qty", "Value", "P&L"].map((col) => (
                <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
              ))}
            </div>
            {holdingRows.length === 0 && besRows.length === 0 ? (
              <div className="flex items-center justify-center py-8"><p className="text-sm text-white/20">No positions yet</p></div>
            ) : (
              <>
                {holdingRows.map(({ asset, holding, currentValue, pnl, pnlPct }) => (
                  <div key={holding.id} className="grid grid-cols-[1fr_90px_100px_110px] px-5 py-3 border-b border-white/5 last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-white">{asset?.name ?? "—"}</p>
                      <p className="text-xs text-white/30">{asset?.symbol ?? "—"}</p>
                    </div>
                    <span className="text-sm text-white/60 font-mono">{holding.quantity.toFixed(2)}</span>
                    <span className="text-sm text-white font-mono">
                      {currentValue !== null ? `${sym}${formatCurrency(currentValue)}` : "—"}
                    </span>
                    <div>
                      {pnl !== null ? (
                        <>
                          <p className={cn("text-sm font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {pnl >= 0 ? "+" : ""}{sym}{formatCurrency(Math.abs(pnl))}
                          </p>
                          <p className={cn("text-xs font-mono", pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                            {pnl >= 0 ? "+" : ""}{pnlPct?.toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-white/20">—</span>
                      )}
                    </div>
                  </div>
                ))}
                {besRows.map((plan) => (
                  <div key={`bes-${plan.id}`} className="grid grid-cols-[1fr_90px_100px_110px] px-5 py-3 border-b border-white/5 last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-white">{plan.name}</p>
                      <p className="text-xs text-white/30">BES · {plan.company}</p>
                    </div>
                    <span className="text-sm text-white/30 font-mono">—</span>
                    <span className="text-sm text-white font-mono">
                      {plan.current_value !== null ? `₺${formatCurrency(plan.current_value)}` : "—"}
                    </span>
                    <div>
                      {plan.pnl !== null ? (
                        <>
                          <p className={cn("text-sm font-mono font-medium", plan.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                            {plan.pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(plan.pnl))}
                          </p>
                          <p className={cn("text-xs font-mono", plan.pnl >= 0 ? "text-emerald-400/60" : "text-red-400/60")}>
                            {plan.pnl >= 0 ? "+" : ""}{plan.pnl_pct?.toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-white/20">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
        </div>

        {/* Recent investments */}
        <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <p className="text-sm font-medium text-white">Recent Investment Transactions</p>
            <button onClick={() => navigate("/investments/transactions")} className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentInvestments.length === 0 ? (
            <div className="flex items-center justify-center py-8"><p className="text-sm text-white/20">No investment transactions yet</p></div>
          ) : (
            recentInvestments.map((t) => {
              const asset = walletAssets.find((a) => a.id === t.asset_id);
              const isBuy = t.transaction_type === "BUY";
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isBuy ? "#34d399" : "#f87171" }} />
                    <div>
                      <p className="text-sm text-white">{asset?.name ?? "—"}</p>
                      <p className="text-xs text-white/30">{formatDateShort(t.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-medium font-mono", isBuy ? "text-emerald-400" : "text-red-400")}>
                      {isBuy ? "+" : "−"}{t.quantity.toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30 font-mono">{sym}{formatCurrency(t.price)}/unit</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
