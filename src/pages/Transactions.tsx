import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { transactionsApi } from "../api/transactions";
import { useAppStore } from "../store/useAppStore";
import type { Transaction, TransactionType } from "../types";
import { cn } from "../lib/utils";

type FilterType = "all" | TransactionType;

const TYPE_BADGE: Record<
  TransactionType,
  { label: string; className: string }
> = {
  income: {
    label: "Income",
    className:
      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
  expense: {
    label: "Expense",
    className: "bg-red-500/10 text-red-400 border border-red-500/20",
  },
};

function formatAmount(amount: number, type: TransactionType): string {
  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return type === "income" ? `+ ₺${formatted}` : `− ₺${formatted}`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

interface TransactionFormData {
  description: string;
  type: TransactionType;
  category_id: string;
  amount: string;
  date: string;
}

const EMPTY_FORM: TransactionFormData = {
  description: "",
  type: "expense",
  category_id: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
};

interface TransactionModalProps {
  initial?: TransactionFormData;
  onSubmit: (data: TransactionFormData) => void;
  onClose: () => void;
  loading: boolean;
}

function TransactionModal({
  initial = EMPTY_FORM,
  onSubmit,
  onClose,
  loading,
}: TransactionModalProps) {
  const categories = useAppStore((s) => s.categories);
  const [form, setForm] = useState<TransactionFormData>(initial);
  const [errors, setErrors] = useState<Partial<TransactionFormData>>({});

  function validate(): boolean {
    const next: Partial<TransactionFormData> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      next.amount = "Enter a valid amount";
    if (!form.date) next.date = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit(form);
  }

  function field(key: keyof TransactionFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-5">
          {initial === EMPTY_FORM ? "Add Transaction" : "Edit Transaction"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {(["income", "expense"] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => field("type", t)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
                    form.type === t
                      ? t === "income"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-red-500/15 text-red-400 border border-red-500/25"
                      : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/[0.08]",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Description <span className="text-white/25">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => field("description", e.target.value)}
              placeholder="e.g. Grocery shopping"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Amount (₺)
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => field("amount", e.target.value)}
              placeholder="0.00"
              min="0"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors font-mono",
                errors.amount
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-white/[0.08] focus:border-violet-500/50",
              )}
            />
            {errors.amount && (
              <p className="text-xs text-red-400 mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Category <span className="text-white/25">(optional)</span>
            </label>
            <select
              value={form.category_id}
              onChange={(e) => field("category_id", e.target.value)}
              className="w-full bg-[#0e0e18] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50 transition-colors"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => field("date", e.target.value)}
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors",
                errors.date
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-white/[0.08] focus:border-violet-500/50",
              )}
            />
            {errors.date && (
              <p className="text-xs text-red-400 mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Transactions() {
  const {
    transactions,
    categories,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [mutating, setMutating] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await transactionsApi.list();
        setTransactions(data);
      } catch {
        setFetchError("Failed to load transactions.");
      }
    }

    fetchTransactions();
  }, [setTransactions]);

  const filtered = transactions.filter((t) =>
    filter === "all" ? true : t.type === filter,
  );

  function getCategoryName(category_id: number | null): string {
    if (!category_id) return "—";
    return categories.find((c) => c.id === category_id)?.name ?? "—";
  }

  async function handleAdd(data: TransactionFormData) {
    setMutating(true);
    try {
      const created = await transactionsApi.create({
        amount: Number(data.amount),
        type: data.type,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id: data.category_id ? Number(data.category_id) : null,
      });
      addTransaction(created);
      setShowModal(false);
    } catch {
      // TODO: show inline error
    } finally {
      setMutating(false);
    }
  }

  async function handleEdit(data: TransactionFormData) {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await transactionsApi.update(editing.id, {
        amount: Number(data.amount),
        type: data.type,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id: data.category_id ? Number(data.category_id) : null,
      });
      updateTransaction(editing.id, updated);
      setEditing(null);
    } catch {
      // TODO: show inline error
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await transactionsApi.delete(id);
      deleteTransaction(id);
    } catch {
      // TODO: show inline error
    }
  }

  const editingFormData: TransactionFormData | undefined = editing
    ? {
        description: editing.description ?? "",
        type: editing.type,
        category_id: editing.category_id ? String(editing.category_id) : "",
        amount: String(editing.amount),
        date: editing.date.split("T")[0],
      }
    : undefined;

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Transactions</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {transactions.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Transaction
        </button>
      </div>

      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              filter === f
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {fetchError ? (
        <div className="flex-1 flex items-center justify-center bg-[#0e0e18] border border-white/5 rounded-xl">
          <p className="text-sm text-red-400">{fetchError}</p>
        </div>
      ) : (
        <div className="flex-1 bg-[#0e0e18] border border-white/5 rounded-xl overflow-hidden flex flex-col">
          <div className="grid grid-cols-[1fr_100px_140px_110px_120px_60px] px-4 py-3 border-b border-white/5 shrink-0">
            {["Description", "Type", "Category", "Date", "Amount", ""].map(
              (col, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium text-white/30 uppercase tracking-wider"
                >
                  {col}
                </span>
              ),
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-sm text-white/20">No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {filtered.map((transaction) => {
                const badge = TYPE_BADGE[transaction.type];
                return (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-[1fr_100px_140px_110px_120px_60px] px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <span className="text-sm text-white truncate pr-4">
                      {transaction.description ?? "—"}
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
                      {getCategoryName(transaction.category_id)}
                    </span>
                    <span className="text-sm text-white/40">
                      {formatDate(transaction.date)}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium font-mono",
                        transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400",
                      )}
                    >
                      {formatAmount(transaction.amount, transaction.type)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(transaction)}
                        className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
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
        </div>
      )}

      {showModal && (
        <TransactionModal
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}
      {editing && editingFormData && (
        <TransactionModal
          initial={editingFormData}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={mutating}
        />
      )}
    </div>
  );
}
