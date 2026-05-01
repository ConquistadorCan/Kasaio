import { useMemo, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useUIStore } from "../store/useUIStore";
import { formatCurrency } from "../lib/formatters";
import { PageHeader } from "../components/ui/primitives/PageHeader";
import { SectionHeader } from "../components/ui/primitives/SectionHeader";
import { Segmented } from "../components/ui/primitives/Segmented";
import { Empty } from "../components/ui/primitives/Empty";

function getLast(n: number): { key: string; label: string }[] {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("tr-TR", { month: "short" }),
    });
  }
  return result;
}

const SYM: Record<string, string> = { TRY: "₺", USD: "$" };

export function Insights() {
  const { transactions, categories } = useAppStore();
  const walletView = useUIStore((s) => s.walletView);
  const [period, setPeriod] = useState<"3m" | "6m" | "12m">("6m");

  const sym = SYM[walletView] ?? "₺";
  const nMonths = period === "12m" ? 12 : period === "3m" ? 3 : 6;

  const walletTxns = useMemo(
    () => transactions.filter((t) => t.currency === walletView),
    [transactions, walletView]
  );

  const months = useMemo(() => getLast(nMonths), [nMonths]);

  const monthlyData = useMemo(() => {
    return months.map(({ key, label }) => {
      const m = walletTxns.filter((t) => t.date.startsWith(key));
      const inc = m.filter((t) => t.type.toLowerCase() === "income").reduce((s, t) => s + t.amount, 0);
      const exp = m.filter((t) => t.type.toLowerCase() === "expense").reduce((s, t) => s + t.amount, 0);
      return { label, inc, exp, key };
    });
  }, [walletTxns, months]);

  const totals = useMemo(() => {
    const inc = monthlyData.reduce((s, m) => s + m.inc, 0);
    const exp = monthlyData.reduce((s, m) => s + m.exp, 0);
    return {
      avgInc: inc / nMonths,
      avgExp: exp / nMonths,
      net: inc - exp,
      savingsRate: inc > 0 ? ((inc - exp) / inc) * 100 : 0,
    };
  }, [monthlyData, nMonths]);

  const maxBar = Math.max(...monthlyData.map((m) => Math.max(m.inc, m.exp)), 1);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of walletTxns.filter((t) => t.type.toLowerCase() === "expense")) {
      const cat = categories.find((c) => c.id === t.category_id);
      const key = cat?.name ?? "Other";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [walletTxns, categories]);

  const incomeByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of walletTxns.filter((t) => t.type.toLowerCase() === "income")) {
      const cat = categories.find((c) => c.id === t.category_id);
      const key = cat?.name ?? "Other";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [walletTxns, categories]);

  const kpis = [
    { label: "Avg monthly income",  value: `${sym}${formatCurrency(totals.avgInc)}`, tone: "pos" },
    { label: "Avg monthly expense", value: `${sym}${formatCurrency(totals.avgExp)}`, tone: "neg" },
    { label: "Avg monthly net",     value: `${totals.net / nMonths >= 0 ? "+" : "−"}${sym}${formatCurrency(Math.abs(totals.net / nMonths))}`, tone: totals.net >= 0 ? "pos" : "neg" },
    { label: "Savings rate",        value: `${totals.savingsRate.toFixed(1)}%`, tone: totals.savingsRate >= 0 ? "pos" : "neg" },
  ];

  return (
    <div className="page-in" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PageHeader
        title="Insights"
        meta={`Cash flow patterns · ${walletView}`}
        actions={
          <Segmented
            size="sm"
            options={[{ value: "3m", label: "3M" }, { value: "6m", label: "6M" }, { value: "12m", label: "12M" }]}
            value={period}
            onChange={(v) => setPeriod(v as typeof period)}
          />
        }
      />

      {/* KPI strip */}
      <div className="surface" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ padding: "14px 16px", borderRight: i < 3 ? "1px solid var(--line)" : "none" }}>
            <span className="mono" style={{
              fontSize: 10, color: "var(--fg-4)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {k.label}
            </span>
            <div
              className="num"
              style={{
                fontSize: 20, fontWeight: 600, marginTop: 4,
                color: k.tone === "pos" ? "var(--success)" : "var(--danger)",
              }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly bars */}
      <div className="surface">
        <SectionHeader
          eyebrow="TREND"
          title="Income vs expense by month"
          right={
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--fg-3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot" style={{ background: "var(--success)" }} />Income
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="dot" style={{ background: "var(--danger)" }} />Expense
              </span>
            </div>
          }
        />
        <div style={{ padding: "16px 20px 20px" }}>
          {monthlyData.every((m) => m.inc === 0 && m.exp === 0) ? (
            <Empty title="No transactions" hint={`No ${walletView} transactions in this period.`} />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${monthlyData.length}, 1fr)`,
              gap: 8, alignItems: "end", height: 160,
            }}>
              {monthlyData.map((m, i) => {
                const incH = (m.inc / maxBar) * 100;
                const expH = (m.exp / maxBar) * 100;
                const net = m.inc - m.exp;
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 3, width: "100%", justifyContent: "center" }}>
                      <div
                        title={`Income ${sym}${formatCurrency(m.inc)}`}
                        style={{
                          width: "40%", maxWidth: 16,
                          height: `${incH}%`, minHeight: m.inc > 0 ? 2 : 0,
                          background: "linear-gradient(180deg, oklch(0.78 0.15 155 / 0.95), oklch(0.78 0.15 155 / 0.55))",
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                      <div
                        title={`Expense ${sym}${formatCurrency(m.exp)}`}
                        style={{
                          width: "40%", maxWidth: 16,
                          height: `${expH}%`, minHeight: m.exp > 0 ? 2 : 0,
                          background: "linear-gradient(180deg, oklch(0.70 0.20 25 / 0.95), oklch(0.70 0.20 25 / 0.55))",
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 6, textTransform: "uppercase" }}>{m.label}</div>
                    <div
                      className="num"
                      style={{ fontSize: 10, fontWeight: 500, marginTop: 2, color: net >= 0 ? "var(--success)" : "var(--danger)" }}
                    >
                      {net >= 0 ? "+" : "−"}{sym}{formatCurrency(Math.abs(net)).replace(/[,.]\d+$/, "")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two-column category breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <CategoryBreakdown title="Top expense categories" eyebrow="EXPENSES" tone="neg" rows={expenseByCategory} sym={sym} />
        <CategoryBreakdown title="Income sources" eyebrow="INCOME" tone="pos" rows={incomeByCategory} sym={sym} />
      </div>
    </div>
  );
}

function CategoryBreakdown({ title, eyebrow, tone, rows, sym }: {
  title: string;
  eyebrow: string;
  tone: "pos" | "neg";
  rows: { name: string; value: number }[];
  sym: string;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  const top = rows.slice(0, 8);
  return (
    <div className="surface">
      <SectionHeader eyebrow={eyebrow} title={title} />
      {top.length === 0 ? (
        <Empty title="No data" hint="No transactions in this period." />
      ) : (
        <div style={{ padding: "6px 0" }}>
          {top.map((r, i) => {
            const pct = total > 0 ? (r.value / total) * 100 : 0;
            return (
              <div key={i} style={{ padding: "8px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                    <span className="num" style={{ fontSize: 10.5, color: "var(--fg-5)" }}>{pct.toFixed(1)}%</span>
                  </div>
                  <span
                    className="num"
                    style={{ fontSize: 12.5, fontWeight: 500, color: tone === "pos" ? "var(--success)" : "var(--danger)" }}
                  >
                    {sym}{formatCurrency(r.value)}
                  </span>
                </div>
                <div style={{ height: 3, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: tone === "neg" ? "var(--danger)" : "var(--success)",
                    opacity: 0.85,
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
