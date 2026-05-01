import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintTone?: "pos" | "neg" | "info" | "warn";
  mono?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Stat({ label, value, hint, hintTone = "info", mono = true, size = "md" }: StatProps) {
  const fontSize = size === "lg" ? 26 : size === "sm" ? 16 : 20;
  const toneClass = hintTone === "pos" ? "pos-bg" : hintTone === "neg" ? "neg-bg" : hintTone === "warn" ? "warn-bg" : "info-bg";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="mono" style={{
        fontSize: 10, color: "var(--fg-4)",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <span
        className={mono ? "num" : ""}
        style={{
          fontSize,
          fontWeight: 600,
          color: "var(--fg)",
          letterSpacing: "-0.01em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {hint && (
        <span className={`pill pill-sm ${toneClass}`} style={{ alignSelf: "flex-start" }}>
          {hint}
        </span>
      )}
    </div>
  );
}
