export type CategoryMode = "fill" | "deplete";

export interface Category {
  id: string;
  name: string;
  /** Monthly budget limit for this category, in dollars. */
  budget: number;
  /** "fill": bar fills up as you spend. "deplete": bar starts full and empties as you spend (e.g. an allowance). */
  mode: CategoryMode;
  /** When on, unused budget (or overspending) carries into the next month. */
  rollover?: boolean;
  /** First month (YYYY-MM) that counts toward rollover; set when rollover is turned on. */
  rolloverFrom?: string;
}

export type TransactionType = "income" | "expense";

export interface TransactionInput {
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // always positive
  categoryId: string | null; // null for income
  note: string;
}

export interface Transaction extends TransactionInput {
  id: string;
  /** Set when this transaction was created by (or started) a recurring rule. */
  recurringId?: string;
}

export interface RecurringRule {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  note: string;
  /** Day of the month it repeats on; clamped to the month's length (e.g. 31 -> 30). */
  dayOfMonth: number;
  /** Most recent month (YYYY-MM) a transaction was created for. */
  lastGeneratedMonth: string;
}

/** Auto-categorize: an expense whose note contains `match` gets `categoryId`. */
export interface CategoryRule {
  id: string;
  match: string;
  categoryId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** Optional month (YYYY-MM) to reach the target by. */
  targetMonth?: string;
}

export interface BudgetData {
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringRule[];
  rules: CategoryRule[];
  goals: SavingsGoal[];
}

export type Section = "dashboard" | "thisMonth" | "reports" | "goals" | "categories" | "settings";

export const SECTION_LABELS: Record<Section, string> = {
  dashboard: "Dashboard",
  thisMonth: "This Month",
  reports: "Reports",
  goals: "Goals",
  categories: "Categories",
  settings: "Settings",
};
