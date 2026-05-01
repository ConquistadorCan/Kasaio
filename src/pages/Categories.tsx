import { useState } from "react";
import { Plus, Trash2, Pencil, Lock } from "lucide-react";
import { toast } from "sonner";
import { categoriesApi } from "../api/categories";
import { useAppStore } from "../store/useAppStore";
import { logError } from "../lib/logger";
import { ErrorBanner } from "../components/ui/ErrorComponents";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import type { Category } from "../types";

interface CategoryFormData {
  name: string;
}

const EMPTY_FORM: CategoryFormData = { name: "" };
const SYSTEM_CATEGORY_NAMES = new Set(["Investment Income", "Investment", "Investment Sale"]);

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
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 380, background: "var(--bg-2)", border: "1px solid var(--line-strong)",
        borderRadius: 10, boxShadow: "0 20px 60px oklch(0 0 0 / 0.5)",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
            {mode === "add" ? "Add Category" : "Edit Category"}
          </h2>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
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
              style={{ width: "100%", borderColor: fieldError ? "var(--danger)" : undefined }}
            />
            {fieldError && <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--danger)" }}>{fieldError}</p>}
            {submitError && <ErrorBanner message={submitError} />}
          </div>
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoriesProps {
  embedded?: boolean;
}

export function Categories({ embedded = false }: CategoriesProps) {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [mutating, setMutating] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 16, padding: embedded ? "16px 20px" : 0 }}>
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--fg)" }}>Categories</h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-4)" }}>{categories.length} total</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add Category
          </button>
        </div>
      )}

      {embedded && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>Categories</span>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={13} /> Add
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8,
        }}>
          <p style={{ fontSize: 12.5, color: "var(--fg-4)" }}>No categories yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, overflowY: "auto", flex: 1, alignContent: "start" }}>
          {categories.map((category) => {
            const isSystem = SYSTEM_CATEGORY_NAMES.has(category.name);
            return (
              <div
                key={category.id}
                className="group"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--bg-2)", border: "1px solid var(--line)",
                  borderRadius: 8, padding: "10px 12px",
                  transition: "border-color 80ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
              >
                <span style={{ fontSize: 12.5, color: "var(--fg)", fontWeight: 500 }}>
                  {category.name}
                </span>
                {isSystem ? (
                  <Lock size={13} style={{ color: "var(--fg-5)", flexShrink: 0 }} />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100" style={{ display: "flex", alignItems: "center", gap: 2, transition: "opacity 80ms" }}>
                    <button
                      onClick={() => setEditing(category)}
                      className="btn-icon"
                      style={{ width: 24, height: 24 }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmId(category.id)}
                      className="btn-icon"
                      style={{ width: 24, height: 24, color: "var(--danger)" }}
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
      {confirmId !== null && (
        <ConfirmDialog
          title="Delete category?"
          description="This action cannot be undone."
          onConfirm={() => {
            handleDelete(confirmId);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
