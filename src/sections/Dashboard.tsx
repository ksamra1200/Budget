import { StatTile } from "../components/StatTile";
import { CategoryMeter } from "../components/CategoryMeter";
import { MonthNav } from "../components/MonthNav";
import { BudgetDonut } from "../components/BudgetDonut";
import { AlertsCard } from "../components/AlertsCard";
import type { Alert } from "../alerts";
import type { MonthBudget } from "../rollover";
import type { Category } from "../types";

export function Dashboard({
  monthKey,
  onMonthChange,
  totals,
  categories,
  spentByCategory,
  budgets,
  alerts,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  totals: { income: number; expenses: number; remaining: number };
  categories: Category[];
  spentByCategory: Map<string, number>;
  budgets: Map<string, MonthBudget>;
  alerts: Alert[];
}) {
  return (
    <>
      <div className="month-nav-row">
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

      <AlertsCard alerts={alerts} />

      <div className="stat-row">
        <StatTile label="Income" value={totals.income} />
        <StatTile label="Expenses" value={totals.expenses} />
        <StatTile
          label="Remaining"
          value={totals.remaining}
          tone={totals.remaining >= 0 ? "positive" : "negative"}
        />
      </div>

      <section className="card">
        <h2>Budget breakdown</h2>
        <BudgetDonut categories={categories} spentByCategory={spentByCategory} budgets={budgets} />
      </section>

      <section className="card">
        <h2>Budget by category</h2>
        {categories.length === 0 ? (
          <p className="empty-state">Add a category from the Categories page to start tracking.</p>
        ) : (
          categories.map((c) => (
            <CategoryMeter
              key={c.id}
              name={c.name}
              spent={spentByCategory.get(c.id) ?? 0}
              budget={budgets.get(c.id)?.budget ?? c.budget}
              carried={budgets.get(c.id)?.carried ?? 0}
              mode={c.mode}
            />
          ))
        )}
      </section>
    </>
  );
}
