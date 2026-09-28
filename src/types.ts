export type CategoryMode = "fill" | "deplete";

export interface Category {
  id: string;
  name: string;
  /** Monthly budget limit for this category, in dollars. */
  budget: number;
  /** "fill": bar fills up as you spend. "deplete": bar starts full and empties as you spend (e.g. an allowance). */
  mode: CategoryMode;
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

export interface BudgetData {
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringRule[];
}

export type Section = "dashboard" | "thisMonth" | "categories" | "settings";

export const SECTION_LABELS: Record<Section, string> = {
  dashboard: "Dashboard",
  thisMonth: "This Month",
  categories: "Categories",
  settings: "Settings",
};
