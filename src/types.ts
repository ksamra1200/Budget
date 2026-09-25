export interface Category {
  id: string;
  name: string;
  /** Monthly budget limit for this category, in dollars. */
  budget: number;
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
