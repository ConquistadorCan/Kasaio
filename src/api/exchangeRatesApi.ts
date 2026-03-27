import { api } from "../lib/api";
import type { Currency, ExchangeRate } from "../types/investments";

interface ExchangeRateCreate {
  currency: Currency;
  rate: number;
  recorded_at: string;
}

export const exchangeRatesApi = {
  list: (currency: Currency) => api.get<ExchangeRate[]>(`/exchange-rates/${currency}`),
  latest: (currency: Currency) => api.get<ExchangeRate>(`/exchange-rates/${currency}/latest`),
  create: (payload: ExchangeRateCreate) => api.post<ExchangeRate>("/exchange-rates/", payload),
};