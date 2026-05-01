import { useState } from "react";

export interface DonutSlice {
  value: number;
  color: string;
  label?: string;
}

interface DonutProps {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  hoverIndex?: number | null;
  onHover?: (i: number | null) => void;
}

export function Donut({ slices, size = 132, thickness = 18, hoverIndex, onHover }: DonutProps) {
  const [localHover, setLocalHover] = useState<number | null>(null);
  const active = hoverIndex !== undefined ? hoverIndex : localHover;
  const handleHover = onHover ?? setLocalHover;

  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const cx = size / 2, cy = size / 2;
  const r = (size - thickness) / 2;
  let cum = 0;

  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => {
        const start = (cum / total) * Math.PI * 2 - Math.PI / 2;
        cum += s.value;
        const end = (cum / total) * Math.PI * 2 - Math.PI / 2;
        const large = end - start > Math.PI ? 1 : 0;
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
        const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
        const dim = active != null && active !== i;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            opacity={dim ? 0.25 : 1}
            onMouseEnter={() => handleHover(i)}
            onMouseLeave={() => handleHover(null)}
            style={{ transition: "opacity 120ms", cursor: "pointer" }}
          />
        );
      })}
    </svg>
  );
}
