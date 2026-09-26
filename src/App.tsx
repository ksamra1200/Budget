import { useMemo, useState } from "react";
import { useCloudBudgetData } from "./cloudStorage";
import { currentMonthKey, downloadCsv, formatMonthLabel, monthKeyOf, shiftMonth } from "./utils";
import { MonthNav } from "./components/MonthNav";
import { StatTile } from "./components/StatTile";
import { CategoryMeter } from "./components/CategoryMeter";
import { CategoryManager } from "./components/CategoryManager";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { SavingsGoals } from "./components/SavingsGoals";
import { ThemeToggle } from "./components/ThemeToggle";
import { TrendChart, type MonthlyTotal } from "./components/TrendChart";
import { useTheme } from "./useTheme";
import type { TransactionType } from "./types";

const TREND_MONTHS = 6;

export function BudgetApp({ uid, onSignOut }: { uid: string; onSignOut: () => void }) {
  const { data, loading, update } = useCloudBudgetData(uid);
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const { theme, toggleTheme } = useTheme();

  const monthTransactions = useMemo(
    () => data.transactions.filter((t) => monthKeyOf(t.date) === monthKey),
    [data.transactions, monthKey],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of monthTransactions) {
      if (t.type === "income") income += t.amount;
      else expenses += t.amount;
    }
    return { income, expenses, remaining: income - expenses };
  }, [monthTransactions]);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.type === "expense" && t.categoryId) {
        map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
      }
    }
    return map;
  }, [monthTransactions]);

  const trendMonths = useMemo<MonthlyTotal[]>(() => {
    const keys: string[] = [];
    for (let i = TREND_MONTHS - 1; i >= 0; i--) keys.push(shiftMonth(monthKey, -i));

    const totals = new Map<string, { income: number; expense: number }>(
      keys.map((k) => [k, { income: 0, expense: 0 }]),
    );
    for (const t of data.transactions) {
      const k = monthKeyOf(t.date);
      const bucket = totals.get(k);
      if (!bucket) continue;
      if (t.type === "income") bucket.income += t.amount;
      else bucket.expense += t.amount;
    }

    return keys.map((k) => ({
      key: k,
      label: formatMonthLabel(k).split(" ")[0].slice(0, 3),
      income: totals.get(k)!.income,
      expense: totals.get(k)!.expense,
    }));
  }, [data.transactions, monthKey]);

  function addCategory(name: string, budget: number) {
    update((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: crypto.randomUUID(), name, budget }],
    }));
  }

  function updateCategoryBudget(id: string, budget: number) {
    update((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, budget } : c)),
    }));
  }

  function removeCategory(id: string) {
    update((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }

  function addTransaction(tx: {
    date: string;
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    note: string;
  }) {
    update((prev) => ({
      ...prev,
      transactions: [...prev.transactions, { id: crypto.randomUUID(), ...tx }],
    }));
  }

  function removeTransaction(id: string) {
    update((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }

  function addGoal(name: string, target: number) {
    update((prev) => ({
      ...prev,
      goals: [...prev.goals, { id: crypto.randomUUID(), name, target, saved: 0 }],
    }));
  }

  function updateGoalSaved(id: string, saved: number) {
    update((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, saved } : g)),
    }));
  }

  function removeGoal(id: string) {
    update((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }

  function exportCsv() {
    const categoryName = (id: string | null) =>
      data.categories.find((c) => c.id === id)?.name ?? "";
    const rows = [
      ["Date", "Type", "Category", "Amount", "Note"],
      ...[...data.transactions]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((t) => [
          t.date,
          t.type,
          t.type === "income" ? "" : categoryName(t.categoryId),
          t.amount.toFixed(2),
          t.note,
        ]),
    ];
    downloadCsv(`budget-transactions-${monthKey}.csv`, rows);
  }

  if (loading) {
    return <p className="empty-state" style={{ textAlign: "center", padding: 40 }}>Loading your budget…</p>;
  }

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">Budget</h1>
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />
      </header>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <button type="button" className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </div>

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
        <h2>Income vs. expenses</h2>
        <TrendChart months={trendMonths} />
      </section>

      <section className="card">
        <h2>Budget by category</h2>
        {data.categories.length === 0 ? (
          <p className="empty-state">Add a category below to start tracking.</p>
        ) : (
          data.categories.map((c) => (
            <CategoryMeter
              key={c.id}
              name={c.name}
              spent={spentByCategory.get(c.id) ?? 0}
              budget={c.budget}
            />
          ))
        )}
      </section>

      <section className="card">
        <h2>Add a transaction</h2>
        <TransactionForm categories={data.categories} onAdd={addTransaction} />
      </section>

      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Transactions this month</h2>
          <button type="button" className="secondary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
        <TransactionList
          transactions={monthTransactions}
          categories={data.categories}
          onRemove={removeTransaction}
        />
      </section>

      <SavingsGoals
        goals={data.goals}
        onAdd={addGoal}
        onUpdateSaved={updateGoalSaved}
        onRemove={removeGoal}
      />

      <CategoryManager
        categories={data.categories}
        onAdd={addCategory}
        onUpdateBudget={updateCategoryBudget}
        onRemove={removeCategory}
      />
    </>
  );
}
