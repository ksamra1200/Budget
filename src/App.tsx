import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { useCloudBudgetData } from "./cloudStorage";
import { currentMonthKey, downloadCsv, formatMonthLabel, monthKeyOf, shiftMonth } from "./utils";
import { useTheme } from "./useTheme";
import { Dashboard } from "./sections/Dashboard";
import { ThisMonth } from "./sections/ThisMonth";
import { Categories } from "./sections/Categories";
import { Settings } from "./components/Settings";
import type { MonthlyTotal } from "./components/TrendChart";
import type { CategoryMode, TransactionType } from "./types";

const TREND_MONTHS = 6;

type Section = "dashboard" | "thisMonth" | "categories" | "settings";

export function BudgetApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const { data, loading, update } = useCloudBudgetData(user.uid);
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [section, setSection] = useState<Section>("dashboard");
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const { theme, toggleTheme } = useTheme();

  const firstName = displayName.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hey, ${firstName}!` : "Hey there!";

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

  const totalSaved = useMemo(
    () => data.goals.reduce((sum, g) => sum + g.saved, 0),
    [data.goals],
  );

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

  function addCategory(name: string, budget: number, mode: CategoryMode) {
    update((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: crypto.randomUUID(), name, budget, mode }],
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
        <h1 className="app-title">{greeting}</h1>
        <select
          className="section-select"
          value={section}
          onChange={(e) => setSection(e.target.value as Section)}
          aria-label="Section"
        >
          <option value="dashboard">Dashboard</option>
          <option value="thisMonth">This Month</option>
          <option value="categories">Categories</option>
          <option value="settings">Settings</option>
        </select>
      </header>

      {section === "dashboard" && (
        <Dashboard
          totals={totals}
          totalSaved={totalSaved}
          trendMonths={trendMonths}
          categories={data.categories}
          spentByCategory={spentByCategory}
          goals={data.goals}
          onAddCategory={addCategory}
          onAddGoal={addGoal}
          onUpdateGoalSaved={updateGoalSaved}
          onRemoveGoal={removeGoal}
        />
      )}

      {section === "thisMonth" && (
        <ThisMonth
          monthKey={monthKey}
          onMonthChange={setMonthKey}
          transactions={monthTransactions}
          categories={data.categories}
          onAddTransaction={addTransaction}
          onRemoveTransaction={removeTransaction}
          onExportCsv={exportCsv}
        />
      )}

      {section === "categories" && (
        <Categories
          categories={data.categories}
          onUpdateBudget={updateCategoryBudget}
          onRemove={removeCategory}
        />
      )}

      {section === "settings" && (
        <Settings
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={onSignOut}
          onDisplayNameChange={setDisplayName}
        />
      )}
    </>
  );
}
