import { StatTile } from "../components/StatTile";
import { CategoryMeter } from "../components/CategoryMeter";
import { SavingsGoals } from "../components/SavingsGoals";
import { AddCategoryForm } from "../components/AddCategoryForm";
import { TrendChart, type MonthlyTotal } from "../components/TrendChart";
import type { Category, CategoryMode, SavingsGoal } from "../types";

export function Dashboard({
  totals,
  totalSaved,
  trendMonths,
  categories,
  spentByCategory,
  goals,
  onAddCategory,
  onAddGoal,
  onUpdateGoalSaved,
  onRemoveGoal,
}: {
  totals: { income: number; expenses: number; remaining: number };
  totalSaved: number;
  trendMonths: MonthlyTotal[];
  categories: Category[];
  spentByCategory: Map<string, number>;
  goals: SavingsGoal[];
  onAddCategory: (name: string, budget: number, mode: CategoryMode) => void;
  onAddGoal: (name: string, target: number) => void;
  onUpdateGoalSaved: (id: string, saved: number) => void;
  onRemoveGoal: (id: string) => void;
}) {
  return (
    <>
      <div className="stat-row">
        <StatTile label="Income" value={totals.income} />
        <StatTile label="Expenses" value={totals.expenses} />
        <StatTile
          label="Remaining"
          value={totals.remaining}
          tone={totals.remaining >= 0 ? "positive" : "negative"}
        />
        <StatTile label="Savings" value={totalSaved} tone={totalSaved > 0 ? "positive" : undefined} />
      </div>

      <section className="card">
        <h2>Income vs. expenses</h2>
        <TrendChart months={trendMonths} />
      </section>

      <section className="card">
        <h2>Budget by category</h2>
        {categories.length === 0 ? (
          <p className="empty-state">Add a category below to start tracking.</p>
        ) : (
          categories.map((c) => (
            <CategoryMeter
              key={c.id}
              name={c.name}
              spent={spentByCategory.get(c.id) ?? 0}
              budget={c.budget}
              mode={c.mode}
            />
          ))
        )}
      </section>

      <SavingsGoals
        goals={goals}
        onAdd={onAddGoal}
        onUpdateSaved={onUpdateGoalSaved}
        onRemove={onRemoveGoal}
      />

      <AddCategoryForm onAdd={onAddCategory} />
    </>
  );
}
