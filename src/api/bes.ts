import { api } from "../lib/api";
import type { BESContribution, BESPlan } from "../types/bes";

export const besApi = {
  listPlans: () => api.get<BESPlan[]>("/bes/"),
  createPlan: (data: { name: string; company: string; end_date?: string | null }) =>
    api.post<BESPlan>("/bes/", data),
  updateValue: (planId: number, current_value: number) =>
    api.patch<BESPlan>(`/bes/${planId}/value`, { current_value }),
  addContribution: (planId: number, data: { date: string; amount: number }) =>
    api.post<BESContribution>(`/bes/${planId}/contributions`, data),
  listContributions: (planId: number) =>
    api.get<BESContribution[]>(`/bes/${planId}/contributions`),
};
