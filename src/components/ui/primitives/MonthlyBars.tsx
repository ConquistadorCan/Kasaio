export interface MonthlyBarData {
  label: string;
  income: number;
  expense: number;
}

interface MonthlyBarsProps {
  data: MonthlyBarData[];
  height?: number;
}

export function MonthlyBars({ data, height = 132 }: MonthlyBarsProps) {
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const colW = data.length > 0 ? 56 : 0;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${data.length * colW} ${height}`}
      preserveAspectRatio="none"
    >
      {data.map((d, i) => {
        const ih = (d.income / max) * (height - 24);
        const eh = (d.expense / max) * (height - 24);
        const x = i * colW + 8;
        return (
          <g key={i}>
            <rect x={x}      y={height - 18 - ih} width={18} height={ih} fill="var(--success)" opacity="0.9" rx="1.5" />
            <rect x={x + 22} y={height - 18 - eh} width={18} height={eh} fill="var(--danger)"  opacity="0.9" rx="1.5" />
            <text
              x={x + 20} y={height - 4}
              textAnchor="middle" fontSize="10"
              fill="var(--fg-4)"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
