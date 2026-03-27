import { api } from "../lib/api";
import type { PortfolioSummary } from "../types/investments";

export const portfolioApi = {
  summary: () => api.get<PortfolioSummary>("/portfolio/summary"),
};
