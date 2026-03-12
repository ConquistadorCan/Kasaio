import { useRef, useState } from "react";
import { Pencil, Trash2, ArrowUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { TYPE_BADGE, formatAmount, formatDate } from "./types";
import type { Transaction } from "../../types";

interface TransactionTableProps {
  transactions: Transaction[];
  sortOrder: "desc" | "asc";
  onSortToggle: () => void;
  getCategoryName: (id: number | null) => string;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
}

export function TransactionTable({
  transactions,
  sortOrder,
  onSortToggle,
  getCategoryName,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    if (scrollRef.current) {
      setShowScrollTop(scrollRef.current.scrollTop > 150);
    }
  }

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  const COLS = "grid-cols-[minmax(120px,1fr)_90px_120px_100px_110px_52px]";

  return (
    <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col min-w-0 relative">
      {/* Header */}
      <div
        className={cn(
          "grid px-4 py-3 border-b border-white/5 shrink-0 min-w-[580px]",
          COLS,
        )}
      >
        {["Description", "Type", "Category", "", "Amount", ""].map((col, i) =>
          col === "" && i === 3 ? (
            <button
              key={i}
              onClick={onSortToggle}
              className="flex items-center gap-1 text-[11px] font-medium text-white/30 uppercase tracking-wider hover:text-white/60 transition-colors"
            >
              Date
              <span className="text-[10px]">
                {sortOrder === "desc" ? "↓" : "↑"}
              </span>
            </button>
          ) : (
            <span
              key={i}
              className="text-[11px] font-medium text-white/30 uppercase tracking-wider"
            >
              {col}
            </span>
          ),
        )}
      </div>

      {/* Rows */}
      {transactions.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-sm text-white/20">No transactions yet</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto overflow-x-auto flex-1"
        >
          {transactions.map((t) => {
            const badge = TYPE_BADGE[t.type];
            return (
              <div
                key={t.id}
                className={cn(
                  "grid px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center min-w-[580px]",
                  COLS,
                )}
              >
                <span className="text-sm text-white truncate pr-4">
                  {t.description ?? "—"}
                </span>
                <span>
                  <span
                    className={cn(
                      "text-[11px] font-medium px-2 py-1 rounded-full",
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                </span>
                <span className="text-sm text-white/40">
                  {getCategoryName(t.category_id)}
                </span>
                <span className="text-sm text-white/40">
                  {formatDate(t.date)}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium font-mono",
                    t.type === "income" ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {formatAmount(t.amount, t.type)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(t)}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scroll to top */}
      <button
        onClick={scrollToTop}
        className={cn(
          "absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg transition-all duration-200",
          showScrollTop
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none",
        )}
      >
        <ArrowUp size={16} className="shrink-0" />
      </button>
    </div>
  );
}
