import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useAppStore } from "../store/useAppStore";
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

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: "income" | "expense" | "neutral";
}

function StatCard({ label, value, icon, variant }: StatCardProps) {
  const colors = {
    income: "text-emerald-400",
    expense: "text-red-400",
    neutral: "text-violet-400",
  };

  return (
    <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
        <span className={cn("opacity-60", colors[variant])}>{icon}</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const { transactions, categories } = useAppStore();

  // ── Stat card calculations ──────────────────────────────────────────────
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type.toLowerCase() === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type.toLowerCase() === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }, [transactions]);

  // ── Monthly chart data ──────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = getLast6Months();
    return months.map(({ key, label }) => {
      const monthTxns = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTxns
        .filter((t) => t.type.toLowerCase() === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTxns
        .filter((t) => t.type.toLowerCase() === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { label, income, expense };
    });
  }, [transactions]);

  // ── Recent transactions ─────────────────────────────────────────────────
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [transactions]);

  // ── Category breakdown ──────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    if (categories.length === 0) return [];
    const expenses = transactions.filter((t) => t.type.toLowerCase() === "expense" && t.category_id);
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    const grouped = categories.map((cat) => {
      const amount = expenses
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, amount, percentage: total > 0 ? (amount / total) * 100 : 0 };
    }).filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return grouped;
  }, [transactions, categories]);

  const TYPE_COLORS: Record<TransactionType, string> = {
    income: "#34d399",
    expense: "#f87171",
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-6">

      {/* Stat cards */}
      <div className="flex gap-4">
        <StatCard
          label="Total Income"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp size={16} />}
          variant="income"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(totalExpense)}
          icon={<TrendingDown size={16} />}
          variant="expense"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(netBalance)}
          icon={<Wallet size={16} />}
          variant="neutral"
        />
      </div>

      {/* Monthly chart + Category breakdown */}
      <div className="flex gap-4">

        {/* Monthly bar chart */}
        <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-1">Income vs Expenses</p>
          <p className="text-xs text-white/30 mb-5">Last 6 months</p>
          {transactions.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-white/20">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={10} barGap={3}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(240,240,250,0.3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill="#34d399" opacity={0.8} />
                  ))}
                </Bar>
                <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill="#f87171" opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category breakdown */}
        <div className="w-64 bg-[#0e0e18] border border-white/5 rounded-xl p-5 shrink-0">
          <p className="text-sm font-medium text-white mb-1">By Category</p>
          <p className="text-xs text-white/30 mb-5">Expense breakdown</p>
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-xs text-white/20 text-center leading-relaxed">
                No categories yet.<br />Add some to see breakdown.
              </p>
            </div>
          ) : categoryBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-xs text-white/20 text-center leading-relaxed">
                No categorized<br />expenses yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60 truncate">{cat.name}</span>
                    <span className="text-xs text-white/40 font-mono ml-2 shrink-0">
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <p className="text-sm font-medium text-white">Recent Transactions</p>
          <button
            onClick={() => navigate("/cash-flow/transactions")}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
          >
            View all <ArrowRight size={12} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-white/20">No transactions yet</p>
          </div>
        ) : (
          recentTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: TYPE_COLORS[t.type.toLowerCase() as TransactionType] }}
                />
                <div>
                  <p className="text-sm text-white">{t.description ?? "—"}</p>
                  <p className="text-xs text-white/30">{formatDateShort(t.date)}</p>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-medium font-mono",
                  t.type.toLowerCase() === "income" ? "text-emerald-400" : "text-red-400"
                )}
              >
                {t.type.toLowerCase() === "income" ? "+" : "−"}₺{formatCurrency(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}