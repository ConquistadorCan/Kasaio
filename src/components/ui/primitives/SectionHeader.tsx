import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  right?: ReactNode;
}

export function SectionHeader({ eyebrow, title, right }: SectionHeaderProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {eyebrow && (
          <span className="mono" style={{
            fontSize: 10, color: "var(--fg-4)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            {eyebrow}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{title}</span>
      </div>
      {right}
    </div>
  );
}
