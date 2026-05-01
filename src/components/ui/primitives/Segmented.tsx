interface Option {
  value: string;
  label: string;
}

interface SegmentedProps {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}

export function Segmented({ options, value, onChange, size = "md" }: SegmentedProps) {
  return (
    <div style={{
      display: "inline-flex", padding: 2,
      background: "var(--bg-1)", border: "1px solid var(--line)",
      borderRadius: 6, gap: 1,
    }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            border: 0, cursor: "pointer",
            padding: size === "sm" ? "3px 8px" : "5px 10px",
            fontSize: size === "sm" ? 11.5 : 12,
            fontWeight: 500, borderRadius: 4,
            color: value === o.value ? "var(--fg)" : "var(--fg-3)",
            background: value === o.value ? "var(--bg-3)" : "transparent",
            transition: "80ms", fontFamily: "inherit",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
