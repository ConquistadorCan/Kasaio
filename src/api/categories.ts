import { api } from "../lib/api";
import type { Category } from "../types";

interface CategoryCreatePayload {
  name: string;
}

interface CategoryUpdatePayload {
  name: string;
}

export const categoriesApi = {
  list: () =>
    api.get<Category[]>("/categories/"),

  create: (payload: CategoryCreatePayload) =>
    api.post<Category>("/categories/", payload),

  update: (id: number, payload: CategoryUpdatePayload) =>
    api.patch<Category>(`/categories/${id}`, payload),

  delete: (id: number) =>
    api.delete(`/categories/${id}`),
};