import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { transactionsApi } from "../../api/transactions";
import { useAppStore } from "../../store/useAppStore";
import { logError } from "../../lib/logger";
import { TransactionModal } from "../../components/transactions/TransactionModal";
import { TransactionTable } from "../../components/transactions/TransactionTable";
import { TransactionFilters } from "../../components/transactions/TransactionFilters";
import {
  type FilterType,
  type TransactionFormData,
} from "../../components/transactions/types";
import { type DateRange } from "../../components/transactions/DateRangePicker";
import type { Transaction } from "../../types";

export function Transactions() {
  const {
    transactions,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useAppStore();

  const [filter, setFilter] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [mutating, setMutating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const filtered = transactions
    .filter((t) => filter === "all" || t.type === filter)
    .filter((t) => {
      if (!dateRange) return true;
      const date = new Date(t.date).getTime();
      const from = new Date(dateRange.from + "T00:00:00").getTime();
      const to = new Date(dateRange.to + "T23:59:59").getTime();
      return date >= from && date <= to;
    })
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  function getCategoryName(category_id: number | null): string {
    if (!category_id) return "—";
    return categories.find((c) => c.id === category_id)?.name ?? "—";
  }

  async function handleAdd(
    data: TransactionFormData,
  ): Promise<string | undefined> {
    setMutating(true);
    try {
      const created = await transactionsApi.create({
        amount: Number(data.amount),
        type: data.type,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id:
          data.category_id && data.category_id !== "none"
            ? Number(data.category_id)
            : null,
      });
      addTransaction(created);
      setShowModal(false);
    } catch (err) {
      await logError("Failed to add transaction", err);
      return "Failed to add transaction. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleEdit(
    data: TransactionFormData,
  ): Promise<string | undefined> {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await transactionsApi.update(editing.id, {
        amount: Number(data.amount),
        type: data.type,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id:
          data.category_id && data.category_id !== "none"
            ? Number(data.category_id)
            : null,
      });
      updateTransaction(editing.id, updated);
      setEditing(null);
    } catch (err) {
      await logError("Failed to update transaction", err);
      return "Failed to update transaction. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await transactionsApi.delete(id);
      deleteTransaction(id);
    } catch (err) {
      await logError("Failed to delete transaction", err);
      toast.error("Failed to delete transaction.");
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

      <TransactionFilters
        filter={filter}
        onFilterChange={setFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <TransactionTable
        transactions={filtered}
        sortOrder={sortOrder}
        onSortToggle={() =>
          setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
        }
        getCategoryName={getCategoryName}
        onEdit={setEditing}
        onDelete={handleDelete}
      />

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
