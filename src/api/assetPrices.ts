import { api } from "../lib/api";
import type { AssetPrice } from "../types/investments";

interface AssetPriceCreate {
  asset_id: number;
  price: number;
  recorded_at: string;
}

export const assetPricesApi = {
  list: (assetId: number) => api.get<AssetPrice[]>(`/asset-prices/${assetId}`),
  latest: (assetId: number) => api.get<AssetPrice>(`/asset-prices/${assetId}/latest`),
  create: (payload: AssetPriceCreate) => api.post<AssetPrice>("/asset-prices/", payload),
};