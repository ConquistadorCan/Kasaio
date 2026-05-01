import type { ReactNode } from "react";

type PillTone = "pos" | "neg" | "warn" | "info" | "neutral";

interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  small?: boolean;
}

const TONE_CLASS: Record<PillTone, string> = {
  pos:     "pos-bg",
  neg:     "neg-bg",
  warn:    "warn-bg",
  info:    "info-bg",
  neutral: "",
};

export function Pill({ children, tone = "neutral", small = false }: PillProps) {
  return (
    <span className={`pill ${small ? "pill-sm" : ""} ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}
