import type { BudgetData, RecurringRule, Transaction } from "./types";
import { shiftMonth } from "./utils";

function dateInMonth(monthKey: string, day: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

/**
 * Creates any recurring transactions that have come due since each rule last
 * ran, up to and including today. Returns `data` itself (same reference) when
 * nothing is due, so callers can run this freely without triggering a write.
 */
export function generateDueTransactions(data: BudgetData, today: string): BudgetData {
  const created: Transaction[] = [];
  let changed = false;

  const recurring = data.recurring.map((rule): RecurringRule => {
    let last = rule.lastGeneratedMonth;
    for (;;) {
      const next = shiftMonth(last, 1);
      const date = dateInMonth(next, rule.dayOfMonth);
      if (date > today) break;
      created.push({
        id: crypto.randomUUID(),
        date,
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        note: rule.note,
        recurringId: rule.id,
      });
      last = next;
    }
    if (last === rule.lastGeneratedMonth) return rule;
    changed = true;
    return { ...rule, lastGeneratedMonth: last };
  });

  if (!changed) return data;
  return { ...data, recurring, transactions: [...data.transactions, ...created] };
}
