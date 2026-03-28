import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowRight, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
import { useInvestmentStore } from "../store/useInvestmentStore";
import { formatCurrency, formatDateShort } from "../lib/formatters";
import type { TransactionType } from "../types";
import { cn } from "../lib/utils";

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
}

function StatCard({ label, value, sub, subColor, icon, variant }: StatCardProps) {
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
        ₺{value}
      </span>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141422] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={p.name === "income" ? "text-emerald-400" : "text-red-400"}>
          {p.name === "income" ? "Income" : "Expense"}: ₺{formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

const DONUT_COLORS = ["#7c5cfc", "#34d399", "#fbbf24", "#f87171", "#60a5fa"];

export function Dashboard() {
  const navigate = useNavigate();
  const { transactions, categories } = useAppStore();
  const { assets, holdings, latestPrices, investmentTransactions } = useInvestmentStore();

  // ── Cash Flow ───────────────────────────────────────────────────────────
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type.toLowerCase() === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type.toLowerCase() === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }, [transactions]);

  // ── Portfolio ───────────────────────────────────────────────────────────
  const { portfolioValue, portfolioPnl, portfolioPnlPct } = useMemo(() => {
    const portfolioValue = holdings.reduce((sum, h) => {
      const price = latestPrices[h.asset_id]?.price ?? h.average_cost;
      return sum + price * h.quantity;
    }, 0);
    const portfolioCost = holdings.reduce((sum, h) => sum + h.average_cost * h.quantity, 0);
    const portfolioPnl = portfolioValue - portfolioCost;
    const portfolioPnlPct = portfolioCost > 0 ? (portfolioPnl / portfolioCost) * 100 : 0;
    return { portfolioValue, portfolioPnl, portfolioPnlPct };
  }, [holdings, latestPrices]);

  const netWorth = netBalance + portfolioValue;

  // ── Monthly chart ───────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    return getLast6Months().map(({ key, label }) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTxns.filter((t) => t.type.toLowerCase() === "income").reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxns.filter((t) => t.type.toLowerCase() === "expense").reduce((sum, t) => sum + t.amount, 0);
      return { label, income, expense };
    });
  }, [transactions]);

  // ── Category breakdown ──────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    if (categories.length === 0) return [];
    const expenses = transactions.filter((t) => t.type.toLowerCase() === "expense" && t.category_id);
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    return categories.map((cat) => {
      const amount = expenses.filter((t) => t.category_id === cat.id).reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
    }).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [transactions, categories]);

  // ── Asset allocation ────────────────────────────────────────────────────
  const assetAllocation = useMemo(() => {
    return holdings.map((h) => {
      const asset = assets.find((a) => a.id === h.asset_id);
      const price = latestPrices[h.asset_id]?.price ?? h.average_cost;
      return { name: asset?.name ?? "Unknown", value: price * h.quantity };
    }).filter((a) => a.value > 0);
  }, [holdings, assets, latestPrices]);

  // ── Holdings rows ───────────────────────────────────────────────────────
  const holdingRows = useMemo(() => {
    return holdings.map((h) => {
      const asset = assets.find((a) => a.id === h.asset_id);
      const price = latestPrices[h.asset_id]?.price ?? null;
      const currentValue = price !== null ? price * h.quantity : null;
      const costBasis = h.average_cost * h.quantity;
      const pnl = currentValue !== null ? currentValue - costBasis : null;
      const pnlPct = pnl !== null && costBasis > 0 ? (pnl / costBasis) * 100 : null;
      return { asset, holding: h, price, currentValue, pnl, pnlPct };
    });
  }, [holdings, assets, latestPrices]);

  // ── Recent transactions ─────────────────────────────────────────────────
  const recentCashFlow = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  const recentInvestments = useMemo(() => {
    return [...investmentTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [investmentTransactions]);

  const TYPE_COLORS: Record<TransactionType, string> = { income: "#34d399", expense: "#f87171" };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-6">

      {/* ── Section 1: Overview ── */}
      <div className="bg-[#141422] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-violet-400" />
          <p className="text-base font-semibold text-white">Overview</p>
        </div>
        <div className="flex gap-4">
          <StatCard label="Cash Balance" value={formatCurrency(netBalance)} icon={<Wallet size={15} />} variant="neutral" />
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(portfolioValue)}
            sub={`${portfolioPnl >= 0 ? "+" : ""}${portfolioPnlPct.toFixed(2)}%`}
            subColor={portfolioPnl >= 0 ? "text-emerald-400" : "text-red-400"}
            icon={<BarChart2 size={15} />}
            variant="violet"
          />
          <StatCard label="Net Worth" value={formatCurrency(netWorth)} icon={<Wallet size={15} />} variant="neutral" />
        </div>
      </div>

      {/* ── Section 2: Cash Flow ── */}
      <div className="bg-[#141422] border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-violet-400" />
          <p className="text-base font-semibold text-white">Cash Flow</p>
        </div>
        <div className="flex gap-4 mb-4">
          <StatCard label="Total Income" value={formatCurrency(totalIncome)} icon={<TrendingUp size={15} />} variant="income" />
          <StatCard label="Total Expenses" value={formatCurrency(totalExpense)} icon={<TrendingDown size={15} />} variant="expense" />
        </div>

        <div className="grid grid-cols-[1fr_220px] gap-4">
          {/* Bar chart */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
            <p className="text-sm font-medium text-white mb-1">Income vs Expenses</p>
            <p className="text-xs text-white/30 mb-4">Last 6 months</p>
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-36"><p className="text-sm text-white/20">No data yet</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyData} barSize={10} barGap={3}>
                  <XAxis dataKey="label" tick={{ fill: "rgba(240,240,250,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
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
                  {t.type.toLowerCase() === "income" ? "+" : "−"}₺{formatCurrency(t.amount)}
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
          <p className="text-base font-semibold text-white">Portfolio</p>
        </div>

        <div className="grid grid-cols-[180px_1fr] gap-4 mb-4">
          {/* Donut */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl p-5">
            <p className="text-sm font-medium text-white mb-1">Allocation</p>
            {assetAllocation.length === 0 ? (
              <div className="flex items-center justify-center h-24"><p className="text-xs text-white/20">No positions</p></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={assetAllocation} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46}>
                      {assetAllocation.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} opacity={0.85} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5 mt-2">
                  {assetAllocation.map((a, i) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-xs text-white/50 truncate">{a.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Holdings table */}
          <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_90px_100px_110px] px-5 py-3 border-b border-white/5">
              {["Asset", "Qty (g)", "Value", "P&L"].map((col) => (
                <span key={col} className="text-[11px] font-medium text-white/30 uppercase tracking-wider">{col}</span>
              ))}
            </div>
            {holdingRows.length === 0 ? (
              <div className="flex items-center justify-center py-8"><p className="text-sm text-white/20">No positions yet</p></div>
            ) : (
              holdingRows.map(({ asset, holding, currentValue, pnl, pnlPct }) => (
                <div key={holding.id} className="grid grid-cols-[1fr_90px_100px_110px] px-5 py-3 border-b border-white/5 last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-sm text-white">{asset?.name ?? "—"}</p>
                    <p className="text-xs text-white/30">{asset?.symbol ?? "—"}</p>
                  </div>
                  <span className="text-sm text-white/60 font-mono">{holding.quantity.toFixed(2)}</span>
                  <span className="text-sm text-white font-mono">
                    {currentValue !== null ? `₺${formatCurrency(currentValue)}` : "—"}
                  </span>
                  <div>
                    {pnl !== null ? (
                      <>
                        <p className={cn("text-sm font-mono font-medium", pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {pnl >= 0 ? "+" : ""}₺{formatCurrency(Math.abs(pnl))}
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
              ))
            )}
          </div>
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
              const asset = assets.find((a) => a.id === t.asset_id);
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
                      {isBuy ? "+" : "−"}{t.quantity.toFixed(2)}g
                    </p>
                    <p className="text-xs text-white/30 font-mono">₺{formatCurrency(t.price)}/g</p>
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