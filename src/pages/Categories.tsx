import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import type { Category, TransactionType } from "../types";
import { cn } from "../lib/utils";

const PRESET_COLORS = [
  "#f87171", "#fb923c", "#fbbf24", "#a3e635",
  "#34d399", "#22d3ee", "#60a5fa", "#a78bfa",
  "#f472b6", "#94a3b8",
];

interface CategoryFormData {
  name: string;
  type: TransactionType;
  color: string;
}

const EMPTY_FORM: CategoryFormData = {
  name: "",
  type: "expense",
  color: PRESET_COLORS[0],
};

interface CategoryModalProps {
  initial?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  onClose: () => void;
}

function CategoryModal({ initial = EMPTY_FORM, onSubmit, onClose }: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>(initial);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    onSubmit(form);
  }

  function field<K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "name") setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-5">
          {initial === EMPTY_FORM ? "Add Category" : "Edit Category"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Type</label>
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
                      : "bg-white/5 text-white/40 border border-white/5 hover:bg-white/[0.08]"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              placeholder="e.g. Food & Drink"
              className={cn(
                "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors",
                error
                  ? "border-red-500/40 focus:border-red-500/60"
                  : "border-white/[0.08] focus:border-violet-500/50"
              )}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => field("color", color)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-transform hover:scale-110",
                    form.color === color && "ring-2 ring-white/40 ring-offset-2 ring-offset-[#0e0e18]"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white/70 transition-colors border border-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppStore();

  const [activeTab, setActiveTab] = useState<TransactionType>("expense");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const filtered = categories.filter((c) => c.type === activeTab);

  function handleAdd(data: CategoryFormData) {
    addCategory(data);
    setShowModal(false);
  }

  function handleEdit(data: CategoryFormData) {
    if (!editing) return;
    updateCategory(editing.id, data);
    setEditing(null);
  }

  const editingFormData: CategoryFormData | undefined = editing
    ? { name: editing.name, type: editing.type, color: editing.color }
    : undefined;

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-sm text-white/40 mt-0.5">{categories.length} total</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Category
        </button>
      </div>

      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              activeTab === t ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-[#0e0e18] border border-white/5 rounded-xl">
          <p className="text-sm text-white/20">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 content-start overflow-y-auto flex-1">
          {filtered.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between bg-[#0e0e18] border border-white/5 rounded-xl px-4 py-3.5 hover:border-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-white font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(category)}
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal onSubmit={handleAdd} onClose={() => setShowModal(false)} />
      )}
      {editing && editingFormData && (
        <CategoryModal
          initial={editingFormData}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}