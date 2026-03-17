import { api } from "../lib/api";
import type { Holding } from "../types/investments";

export const holdingsApi = {
  list: () => api.get<Holding[]>("/holdings/"),
  get: (assetId: number) => api.get<Holding>(`/holdings/${assetId}`),
};