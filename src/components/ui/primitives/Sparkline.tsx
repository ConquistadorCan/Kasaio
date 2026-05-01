interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
}

export function Sparkline({ data, w = 64, h = 20, color }: SparklineProps) {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data), max = Math.max(...data);
  const r = (max - min) || 1;
  const trend = data[data.length - 1] - data[0];
  const stroke = color || (trend >= 0 ? "var(--success)" : "var(--danger)");
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 2) + 1;
    const y = h - 1 - ((v - min) / r) * (h - 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
    </svg>
  );
}
