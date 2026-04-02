export interface BESPlan {
  id: number;
  name: string;
  company: string;
  current_value: number | null;
  last_updated: string | null;
  end_date: string | null;
  total_paid: number;
  pnl: number | null;
  pnl_pct: number | null;
}

export interface BESContribution {
  id: number;
  plan_id: number;
  date: string;
  amount: number;
}
