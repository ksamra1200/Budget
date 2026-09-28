import { useMemo, useState } from "react";
import { MonthNav } from "../components/MonthNav";
import { IncomeSpendChart, type MonthTotals } from "../components/IncomeSpendChart";
import type { Category, Transaction } from "../types";
import { formatCurrency, formatMonthLabel, monthKeyOf, shiftMonth } from "../utils";

const RANGES = [3, 6, 12] as const;

export function Reports({
  monthKey,
  onMonthChange,
  transactions,
  categories,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  transactions: Transaction[];
  categories: Category[];
}) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(6);

  const { months, byCategory, income, expense } = useMemo(() => {
    const keys: string[] = [];
    for (let i = range - 1; i >= 0; i--) keys.push(shiftMonth(monthKey, -i));
    const totals = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
    const byCat = new Map<string, number>();
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      const bucket = totals.get(monthKeyOf(t.date));
      if (!bucket) continue;
      if (t.type === "income") {
        bucket.income += t.amount;
        income += t.amount;
      } else {
        bucket.expense += t.amount;
        expense += t.amount;
        const id = t.categoryId ?? "";
        byCat.set(id, (byCat.get(id) ?? 0) + t.amount);
      }
    }
    const months: MonthTotals[] = keys.map((k) => ({
      key: k,
      label: formatMonthLabel(k).split(" ")[0].slice(0, 3),
      ...totals.get(k)!,
    }));
    const byCategory = [...byCat.entries()]
      .map(([id, total]) => {
        const c = categories.find((x) => x.id === id);
        return { id, name: c?.name || (id ? "Deleted category" : "Uncategorized"), total, budget: c?.budget ?? 0 };
      })
      .sort((a, b) => b.total - a.total);
    return { months, byCategory, income, expense };
  }, [transactions, categories, monthKey, range]);

  const saved = income - expense;
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : null;
  const topTotal = byCategory[0]?.total ?? 0;

  return (
    <>
      <div className="month-nav-row">
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

      <div className="segmented range-picker" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button key={r} type="button" className={range === r ? "active" : ""} aria-pressed={range === r} onClick={() => setRange(r)}>
            {r} months
          </button>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat-tile">
          <p className="label">Avg income / mo</p>
          <p className="value">{formatCurrency(income / range)}</p>
        </div>
        <div className="stat-tile">
          <p className="label">Avg spending / mo</p>
          <p className="value">{formatCurrency(expense / range)}</p>
        </div>
        <div className="stat-tile">
          <p className="label">Saved</p>
          <p className={`value ${saved >= 0 ? "positive" : "negative"}`}>{formatCurrency(saved)}</p>
          {savingsRate !== null && <p className="stat-sub">{savingsRate}% of income</p>}
        </div>
      </div>

      <section className="card">
        <h2>Income vs. spending</h2>
        {income === 0 && expense === 0 ? (
          <p className="empty-state">No transactions in this period yet.</p>
        ) : (
          <IncomeSpendChart months={months} />
        )}
      </section>

      <section className="card">
        <h2>Spending by category</h2>
        {byCategory.length === 0 ? (
          <p className="empty-state">No spending in this period yet.</p>
        ) : (
          <ul className="rank-list">
            {byCategory.map((c) => {
              const avg = c.total / range;
              return (
                <li key={c.id} className="rank-row">
                  <div className="rank-top">
                    <span className="rank-name">{c.name}</span>
                    <span className="rank-total">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="rank-track">
                    <div className="rank-fill" style={{ width: `${(c.total / topTotal) * 100}%` }} />
                  </div>
                  <div className="rank-sub">
                    {formatCurrency(avg)}/mo average
                    {c.budget > 0 && (
                      <>
                        {" "}· budget {formatCurrency(c.budget)}/mo
                        {avg > c.budget && <span className="rank-over"> · over on average</span>}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
