import { useMemo, useState } from "react";
import { useBudgetData } from "./storage";
import { currentMonthKey, monthKeyOf } from "./utils";
import { MonthNav } from "./components/MonthNav";
import { StatTile } from "./components/StatTile";
import { CategoryMeter } from "./components/CategoryMeter";
import { CategoryManager } from "./components/CategoryManager";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import type { TransactionType } from "./types";

export default function App() {
  const { data, update } = useBudgetData();
  const [monthKey, setMonthKey] = useState(currentMonthKey());

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

  return (
    <>
      <header className="app-header">
        <h1 className="app-title">Budget</h1>
        <MonthNav monthKey={monthKey} onChange={setMonthKey} />
      </header>

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
        <h2>Transactions this month</h2>
        <TransactionList
          transactions={monthTransactions}
          categories={data.categories}
          onRemove={removeTransaction}
        />
      </section>

      <CategoryManager
        categories={data.categories}
        onAdd={addCategory}
        onUpdateBudget={updateCategoryBudget}
        onRemove={removeCategory}
      />
    </>
  );
}
