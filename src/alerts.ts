import type { Category, RecurringRule } from "./types";
import type { MonthBudget } from "./rollover";
import { nextOccurrence } from "./recurring";

export const NEAR_LIMIT_PCT = 90;
export const REMINDER_DAYS = 7;

export type Alert =
  | { kind: "bill"; id: string; name: string; amount: number; date: string; daysUntil: number }
  | { kind: "over"; id: string; name: string; over: number }
  | { kind: "near"; id: string; name: string; pct: number };

function daysBetween(fromISO: string, toISO: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISO.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Recurring expenses coming up in the next week, soonest first. */
export function upcomingBills(
  recurring: RecurringRule[],
  categories: Category[],
  today: string,
): Alert[] {
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Bill";
  return recurring
    .filter((r) => r.type === "expense")
    .map((r) => {
      const date = nextOccurrence(r);
      return {
        kind: "bill" as const,
        id: `bill-${r.id}`,
        name: r.note || categoryName(r.categoryId),
        amount: r.amount,
        date,
        daysUntil: daysBetween(today, date),
      };
    })
    .filter((b) => b.daysUntil >= 0 && b.daysUntil <= REMINDER_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Categories that are over budget, or at 90%+ of it, worst first. */
export function budgetAlerts(
  categories: Category[],
  spentByCategory: Map<string, number>,
  budgets: Map<string, MonthBudget>,
): Alert[] {
  const over: Alert[] = [];
  const near: Alert[] = [];
  for (const c of categories) {
    const budget = budgets.get(c.id)?.budget ?? c.budget;
    const spent = spentByCategory.get(c.id) ?? 0;
    if (budget <= 0 && spent <= 0) continue;
    const name = c.name || "Untitled";
    if (spent > budget) over.push({ kind: "over", id: `over-${c.id}`, name, over: spent - budget });
    else if (budget > 0 && (spent / budget) * 100 >= NEAR_LIMIT_PCT)
      near.push({ kind: "near", id: `near-${c.id}`, name, pct: Math.round((spent / budget) * 100) });
  }
  over.sort((a, b) => (b.kind === "over" && a.kind === "over" ? b.over - a.over : 0));
  near.sort((a, b) => (b.kind === "near" && a.kind === "near" ? b.pct - a.pct : 0));
  return [...over, ...near];
}
