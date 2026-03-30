import { api } from "../lib/api";
import type { Asset } from "../types/investments";

export interface EurobondDetailsUpdate {
  maturity_date: string | null;
  coupon_rate: number | null;
  coupon_frequency: number | null;
  first_coupon_date: string | null;
  face_value: number | null;
}

export const assetsApi = {
  list: () => api.get<Asset[]>("/assets/"),
  get: (id: number) => api.get<Asset>(`/assets/${id}`),
  updateEurobondDetails: (id: number, data: EurobondDetailsUpdate) =>
    api.patch<Asset>(`/assets/${id}/eurobond`, data),
};
