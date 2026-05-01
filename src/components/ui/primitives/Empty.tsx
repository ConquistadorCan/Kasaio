import type { ReactNode } from "react";

interface EmptyProps {
  icon?: ReactNode;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}

export function Empty({ icon, title, hint, action }: EmptyProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: 6, padding: "40px 16px", color: "var(--fg-4)",
    }}>
      {icon && <div style={{ color: "var(--fg-5)", marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 13, color: "var(--fg-3)", fontWeight: 500 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--fg-4)" }}>{hint}</div>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
