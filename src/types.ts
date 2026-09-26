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

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // always positive
  categoryId: string | null; // null for income
  note: string;
}

export interface BudgetData {
  categories: Category[];
  transactions: Transaction[];
}

export type Section = "dashboard" | "thisMonth" | "categories" | "settings";

export const SECTION_LABELS: Record<Section, string> = {
  dashboard: "Dashboard",
  thisMonth: "This Month",
  categories: "Categories",
  settings: "Settings",
};
