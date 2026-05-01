import { useRef, useState } from "react";
import { Pencil, Trash2, ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { formatAmount, formatDate } from "../../lib/formatters";
import { TYPE_BADGE, type CashFlowRow } from "./types";
import { ConfirmDialog } from "../ui/ConfirmDialog";

interface TransactionTableProps {
  transactions: CashFlowRow[];
  sortOrder: "desc" | "asc";
  onSortToggle: () => void;
  getCategoryName: (id: number | null) => string;
  onEdit: (t: CashFlowRow) => void;
  onDelete: (id: number) => void;
}

const COLS = "minmax(120px,1fr) 90px 120px 100px 110px 52px";

export function TransactionTable({
  transactions,
  sortOrder,
  onSortToggle,
  getCategoryName,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 150);
    }
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="surface" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
      {/* Header */}
      <div
        className="table-head"
        style={{ gridTemplateColumns: COLS, minWidth: 580 }}
      >
        {["Description", "Type", "Category", "", "Amount", ""].map((col, i) =>
          col === "" && i === 3 ? (
            <button
              key={i}
              onClick={onSortToggle}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.07em", background: "none", border: "none", cursor: "pointer" }}
            >
              Date
              <span style={{ fontSize: 10 }}>{sortOrder === "desc" ? "↓" : "↑"}</span>
            </button>
          ) : (
            <span key={i}>{col}</span>
          )
        )}
      </div>

      {/* Rows */}
      {transactions.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: 13, color: "var(--fg-5)" }}>No transactions yet</p>
        </div>
      ) : (
        <div ref={scrollRef} onScroll={handleScroll} style={{ overflowY: "auto", overflowX: "auto", flex: 1 }}>
          {transactions.map((t) => {
            const normalizedType = t.type.toLowerCase() as typeof t.type;
            const badge = TYPE_BADGE[normalizedType];
            return (
              <div
                key={t.id}
                className="table-row group"
                style={{ gridTemplateColumns: COLS, minWidth: 580 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <span style={{ fontSize: 13, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>
                  {t.description ?? "—"}
                </span>
                <span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: "var(--r-1)",
                      border: "1px solid",
                      background: normalizedType === "income" ? "var(--success-bg)" : "var(--danger-bg)",
                      color: normalizedType === "income" ? "var(--success)" : "var(--danger)",
                      borderColor: normalizedType === "income" ? "oklch(0.78 0.15 155 / 0.25)" : "oklch(0.70 0.20 25 / 0.25)",
                    }}
                  >
                    {badge.label}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: "var(--fg-4)" }}>{getCategoryName(t.category_id)}</span>
                <span style={{ fontSize: 13, color: "var(--fg-4)" }}>{formatDate(t.date)}</span>
                <span
                  className="num"
                  style={{ fontSize: 13, fontWeight: 500, color: normalizedType === "income" ? "var(--success)" : "var(--danger)" }}
                >
                  {formatAmount(t.amount, normalizedType, t.currency)}
                </span>
                {t._readonly ? (
                  <div />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100" style={{ display: "flex", alignItems: "center", gap: 2, transition: "opacity 80ms" }}>
                    <button
                      onClick={() => onEdit(t)}
                      className="btn-icon"
                      style={{ width: 26, height: 26 }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmId(t.id)}
                      className="btn-icon"
                      style={{ width: 26, height: 26, color: "var(--danger)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className={cn(
          "absolute bottom-4 right-4 w-9 h-9 flex items-center justify-center rounded-full shadow-lg transition-all duration-200",
          showScrollTop ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-75 pointer-events-none"
        )}
        style={{ background: "var(--accent)", color: "oklch(0.15 0.02 250)" }}
      >
        <ArrowUp size={15} className="shrink-0" />
      </button>

      {confirmId !== null && (
        <ConfirmDialog
          title="Delete transaction?"
          description="This action cannot be undone."
          onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
