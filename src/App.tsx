import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { useCloudBudgetData } from "./cloudStorage";
import { currentMonthKey, downloadCsv, formatMonthLabel, monthKeyOf, shiftMonth } from "./utils";
import { useTheme } from "./useTheme";
import { Dashboard } from "./sections/Dashboard";
import { ThisMonth } from "./sections/ThisMonth";
import { Categories } from "./sections/Categories";
import { Settings } from "./components/Settings";
import { SectionMenu } from "./components/SectionMenu";
import type { MonthlyTotal } from "./components/TrendChart";
import { SECTION_LABELS, type CategoryMode, type Section, type TransactionType } from "./types";

const TREND_MONTHS = 6;

export function BudgetApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const { data, loading, update } = useCloudBudgetData(user.uid);
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [section, setSection] = useState<Section>("dashboard");
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
        <h1 className="app-title">{SECTION_LABELS[section]}</h1>
        <SectionMenu section={section} onChange={setSection} />
      </header>

      {section === "dashboard" && (
        <Dashboard
          totals={totals}
          trendMonths={trendMonths}
          categories={data.categories}
          spentByCategory={spentByCategory}
          onAddCategory={addCategory}
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
          onAddCategory={addCategory}
        />
      )}

      {section === "settings" && (
        <Settings user={user} theme={theme} onToggleTheme={toggleTheme} onSignOut={onSignOut} />
      )}
    </>
  );
}
