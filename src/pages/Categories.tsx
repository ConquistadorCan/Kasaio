import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { categoriesApi } from "../api/categories";
import { useAppStore } from "../store/useAppStore";
import { logError } from "../lib/logger";
import { ErrorBanner } from "../components/ui/ErrorComponents";
import type { Category } from "../types";
import { cn } from "../lib/utils";

interface CategoryFormData {
  name: string;
}

const EMPTY_FORM: CategoryFormData = { name: "" };

interface CategoryModalProps {
  mode: "add" | "edit";
  initial?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => Promise<string | undefined>;
  onClose: () => void;
  loading: boolean;
}

function CategoryModal({
  mode,
  initial = EMPTY_FORM,
  onSubmit,
  onClose,
  loading,
}: CategoryModalProps) {
  const [form, setForm] = useState<CategoryFormData>(initial);
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit() {
    if (!form.name.trim()) {
      setFieldError("Name is required");
      return;
    }
    setSubmitError("");
    const err = await onSubmit(form);
    if (err) setSubmitError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0e0e18] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-base font-semibold text-white mb-5">
          {mode === "add" ? "Add Category" : "Edit Category"}
        </h2>

        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm({ name: e.target.value });
              setFieldError("");
              setSubmitError("");
            }}
            placeholder="e.g. Food & Drink"
            className={cn(
              "w-full bg-white/5 border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none transition-colors",
              fieldError
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-white/[0.08] focus:border-violet-500/50",
            )}
          />
          {fieldError && (
            <p className="text-xs text-red-400 mt-1">{fieldError}</p>
          )}
          {submitError && <ErrorBanner message={submitError} />}
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

export function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [mutating, setMutating] = useState(false);

  async function handleAdd(
    data: CategoryFormData,
  ): Promise<string | undefined> {
    setMutating(true);
    try {
      const created = await categoriesApi.create({ name: data.name });
      addCategory(created);
      setShowModal(false);
    } catch (err) {
      await logError("Failed to add category", err);
      return "Failed to add category. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleEdit(
    data: CategoryFormData,
  ): Promise<string | undefined> {
    if (!editing) return;
    setMutating(true);
    try {
      const updated = await categoriesApi.update(editing.id, {
        name: data.name,
      });
      updateCategory(editing.id, updated);
      setEditing(null);
    } catch (err) {
      await logError("Failed to update category", err);
      return "Failed to update category. Please try again.";
    } finally {
      setMutating(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await categoriesApi.delete(id);
      deleteCategory(id);
    } catch (err) {
      await logError("Failed to delete category", err);
      toast.error("Failed to delete category.");
    }
  }

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Categories</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {categories.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-[#0e0e18] border border-white/5 rounded-xl">
          <p className="text-sm text-white/20">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 content-start overflow-y-auto flex-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between bg-[#0e0e18] border border-white/5 rounded-xl px-4 py-3.5 hover:border-white/10 transition-colors group"
            >
              <span className="text-sm text-white font-medium">
                {category.name}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(category)}
                  className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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
        <CategoryModal
          mode="add"
          onSubmit={handleAdd}
          onClose={() => setShowModal(false)}
          loading={mutating}
        />
      )}
      {editing && (
        <CategoryModal
          mode="edit"
          initial={{ name: editing.name }}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={mutating}
        />
      )}
    </div>
  );
}
