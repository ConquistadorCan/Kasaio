import { api } from "../lib/api";
import type { Asset } from "../types/investments";

export const assetsApi = {
  list: () => api.get<Asset[]>("/assets/"),
  get: (id: number) => api.get<Asset>(`/assets/${id}`),
};