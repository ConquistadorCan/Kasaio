import { create } from "zustand";
import type { BESPlan } from "../types/bes";

interface BESStore {
  plans: BESPlan[];
  setPlans: (plans: BESPlan[]) => void;
  upsertPlan: (plan: BESPlan) => void;
}

export const useBESStore = create<BESStore>((set) => ({
  plans: [],
  setPlans: (plans) => set({ plans }),
  upsertPlan: (plan) =>
    set((s) => {
      const exists = s.plans.some((p) => p.id === plan.id);
      return {
        plans: exists
          ? s.plans.map((p) => (p.id === plan.id ? plan : p))
          : [...s.plans, plan],
      };
    }),
}));
