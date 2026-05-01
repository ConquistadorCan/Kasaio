import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, meta, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end",
      justifyContent: "space-between",
      marginBottom: 16, gap: 16,
    }}>
      <div>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 600,
          letterSpacing: "-0.015em", color: "var(--fg)",
        }}>
          {title}
        </h1>
        {meta && (
          <div style={{ marginTop: 4, fontSize: 12, color: "var(--fg-4)" }}>{meta}</div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>
      )}
    </div>
  );
}
