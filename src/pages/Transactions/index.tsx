import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { transactionsApi } from "../../api/transactions";
import { useAppStore } from "../../store/useAppStore";
import { useInvestmentStore } from "../../store/useInvestmentStore";
import { logError } from "../../lib/logger";
import { TransactionModal } from "../../components/transactions/TransactionModal";
import { TransactionTable } from "../../components/transactions/TransactionTable";
import { TransactionFilters } from "../../components/transactions/TransactionFilters";
import { type FilterType, type TransactionFormData, type CashFlowRow } from "../../components/transactions/types";
import { type DateRange } from "../../components/transactions/DateRangePicker";
import type { Transaction } from "../../types";
export function Transactions() {
  const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } =
    useAppStore();
  const { investmentTransactions, assets: investmentAssets } = useInvestmentStore();

  const [filter, setFilter] = useState<FilterType>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [mutating, setMutating] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const filtered = transactions
    .filter((t) => filter === "all" || t.type.toLowerCase() === filter)
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

  const investmentRows: CashFlowRow[] = investmentTransactions.map((t) => {
    const asset = investmentAssets.find((a) => a.id === t.asset_id);
    const isBuy = t.transaction_type === "BUY";
    const label = t.transaction_type === "BUY" ? "Buy" : t.transaction_type === "SELL" ? "Sale" : "Income";
    return {
      id: 2_000_000 + t.id,
      description: `${label}: ${asset?.name ?? t.asset_id}`,
      type: isBuy ? "expense" : "income",
      currency: (asset?.currency ?? "TRY") as "TRY" | "USD",
      category_id: null,
      amount: t.quantity * t.price,
      date: t.date,
      _readonly: true,
    };
  });

  const filteredInvestmentRows = investmentRows
    .filter((r) => filter === "all" || r.type === filter)
    .filter((r) => {
      if (!dateRange) return true;
      const date = new Date(r.date).getTime();
      const from = new Date(dateRange.from + "T00:00:00").getTime();
      const to = new Date(dateRange.to + "T23:59:59").getTime();
      return date >= from && date <= to;
    });

  const allRows: CashFlowRow[] = [...filtered, ...filteredInvestmentRows].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortOrder === "desc" ? -diff : diff;
  });

  function getCategoryName(category_id: number | null): string {
    if (!category_id) return "—";
    return categories.find((c) => c.id === category_id)?.name ?? "—";
  }

  async function handleAdd(data: TransactionFormData): Promise<string | undefined> {
    setMutating(true);
    try {
      const created = await transactionsApi.create({
        amount: Number(data.amount),
        type: data.type,
        currency: data.currency,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id: data.category_id && data.category_id !== "none" ? Number(data.category_id) : null,
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

  async function handleEdit(data: TransactionFormData): Promise<string | undefined> {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await transactionsApi.update(editing.id, {
        amount: Number(data.amount),
        type: data.type,
        description: data.description || null,
        date: new Date(data.date).toISOString(),
        category_id: data.category_id && data.category_id !== "none" ? Number(data.category_id) : null,
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
        currency: editing.currency,
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
          <p className="text-sm text-white/40 mt-0.5">{transactions.length + investmentTransactions.length} total</p>
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
        transactions={allRows}
        sortOrder={sortOrder}
        onSortToggle={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
        getCategoryName={getCategoryName}
        onEdit={(t) => { if (!t._readonly) setEditing(t as Transaction); }}
        onDelete={handleDelete}
      />

      {showModal && (
        <TransactionModal
          mode="add"
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}
      {editing && editingFormData && (
        <TransactionModal
          mode="edit"
          initial={editingFormData}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={mutating}
        />
      )}
    </div>
  );
}
