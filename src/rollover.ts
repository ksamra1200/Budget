import type { Category, Transaction } from "./types";
import { monthKeyOf, shiftMonth } from "./utils";

export interface MonthBudget {
  /** What the category can spend this month, including anything carried in. Never below 0. */
  budget: number;
  /** Carried in from earlier months: positive if underspent, negative if overspent. */
  carried: number;
}

/**
 * Each category's budget for `monthKey`. Categories with rollover on carry
 * leftover money (or overspending) forward month to month, starting from
 * the month rollover was turned on.
 */
export function budgetsForMonth(
  categories: Category[],
  transactions: Transaction[],
  monthKey: string,
): Map<string, MonthBudget> {
  const rolling = categories.filter((c) => c.rollover && c.rolloverFrom && c.rolloverFrom < monthKey);

  // Spending per category per month, only for what rollover needs.
  const spent = new Map<string, number>();
  if (rolling.length > 0) {
    const ids = new Set(rolling.map((c) => c.id));
    for (const t of transactions) {
      if (t.type !== "expense" || !t.categoryId || !ids.has(t.categoryId)) continue;
      const key = `${t.categoryId}|${monthKeyOf(t.date)}`;
      spent.set(key, (spent.get(key) ?? 0) + t.amount);
    }
  }

  const result = new Map<string, MonthBudget>();
  for (const c of categories) {
    let carried = 0;
    if (c.rollover && c.rolloverFrom && c.rolloverFrom < monthKey) {
      for (let m = c.rolloverFrom; m < monthKey; m = shiftMonth(m, 1)) {
        carried += c.budget - (spent.get(`${c.id}|${m}`) ?? 0);
      }
    }
    result.set(c.id, { budget: Math.max(0, c.budget + carried), carried });
  }
  return result;
}
