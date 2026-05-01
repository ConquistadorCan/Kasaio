import { useEffect, type ReactNode } from "react";
import * as Portal from "@radix-ui/react-portal";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const WIDTHS = { sm: 380, md: 480, lg: 640 };

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal.Root>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "oklch(0 0 0 / 0.55)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "pageIn 140ms ease-out",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: WIDTHS[size], maxWidth: "calc(100% - 32px)",
            background: "var(--bg-2)", border: "1px solid var(--line-strong)",
            borderRadius: 10,
            boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)",
          }}
        >
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
            <button className="btn-icon" onClick={onClose}><X size={14} /></button>
          </div>
          <div style={{ padding: 16 }}>{children}</div>
          {footer && (
            <div style={{
              padding: "10px 16px", borderTop: "1px solid var(--line)",
              display: "flex", justifyContent: "flex-end", gap: 8,
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal.Root>
  );
}
