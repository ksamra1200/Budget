import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { useCloudBudgetData } from "./cloudStorage";
import { currentMonthKey, downloadCsv, monthKeyOf, todayISO } from "./utils";
import { generateDueTransactions } from "./recurring";
import { useTheme } from "./useTheme";
import { Dashboard } from "./sections/Dashboard";
import { ThisMonth } from "./sections/ThisMonth";
import { Categories } from "./sections/Categories";
import { Settings } from "./components/Settings";
import { SectionMenu } from "./components/SectionMenu";
import { Sheet } from "./components/Sheet";
import { TransactionForm } from "./components/TransactionForm";
import { UndoToast } from "./components/UndoToast";
import {
  SECTION_LABELS,
  type Category,
  type CategoryMode,
  type RecurringRule,
  type Section,
  type Transaction,
  type TransactionInput,
} from "./types";

const UNDO_MS = 5000;

export function BudgetApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const { data, loading, update } = useCloudBudgetData(user.uid);
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [section, setSection] = useState<Section>("dashboard");
  const { theme, toggleTheme } = useTheme();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [sheetKey, setSheetKey] = useState(0);

  const [toast, setToast] = useState<{ message: string; undo: () => void } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // An installed PWA can stay open in the background for days, so refresh
  // "today" whenever it comes back to the foreground.
  const [today, setToday] = useState(todayISO());
  useEffect(() => {
    function refresh() {
      if (document.visibilityState === "visible") setToday(todayISO());
    }
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  useEffect(() => {
    if (loading) return;
    update((prev) => generateDueTransactions(prev, today));
    // `update` is recreated every render; the inputs that matter are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data.recurring, today]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

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

  function showUndo(message: string, undo: () => void) {
    window.clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), UNDO_MS);
  }

  function handleUndo() {
    toast?.undo();
    window.clearTimeout(toastTimer.current);
    setToast(null);
  }

  function addCategory(name: string, budget: number, mode: CategoryMode) {
    update((prev) => ({
      ...prev,
      categories: [...prev.categories, { id: crypto.randomUUID(), name, budget, mode }],
    }));
  }

  function updateCategory(id: string, patch: Partial<Omit<Category, "id">>) {
    update((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }

  function removeCategory(id: string) {
    const index = data.categories.findIndex((c) => c.id === id);
    if (index < 0) return;
    const removed = data.categories[index];
    update((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }));
    showUndo(`"${removed.name || "Category"}" deleted`, () =>
      update((prev) => {
        if (prev.categories.some((c) => c.id === id)) return prev;
        const categories = [...prev.categories];
        categories.splice(Math.min(index, categories.length), 0, removed);
        return { ...prev, categories };
      }),
    );
  }

  function addTransaction(tx: TransactionInput, repeat: boolean) {
    update((prev) => {
      const id = crypto.randomUUID();
      if (!repeat) return { ...prev, transactions: [...prev.transactions, { id, ...tx }] };
      const rule: RecurringRule = {
        id: crypto.randomUUID(),
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        note: tx.note,
        dayOfMonth: Number(tx.date.slice(8, 10)),
        lastGeneratedMonth: monthKeyOf(tx.date),
      };
      return {
        ...prev,
        transactions: [...prev.transactions, { id, ...tx, recurringId: rule.id }],
        recurring: [...prev.recurring, rule],
      };
    });
  }

  function editTransaction(id: string, tx: TransactionInput) {
    update((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)),
    }));
  }

  function removeTransaction(id: string) {
    const removed = data.transactions.find((t) => t.id === id);
    if (!removed) return;
    update((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
    showUndo("Transaction deleted", () =>
      update((prev) =>
        prev.transactions.some((t) => t.id === id)
          ? prev
          : { ...prev, transactions: [...prev.transactions, removed] },
      ),
    );
  }

  function stopRecurring(id: string) {
    const index = data.recurring.findIndex((r) => r.id === id);
    if (index < 0) return;
    const removed = data.recurring[index];
    update((prev) => ({ ...prev, recurring: prev.recurring.filter((r) => r.id !== id) }));
    showUndo("Recurring transaction stopped", () =>
      update((prev) => {
        if (prev.recurring.some((r) => r.id === id)) return prev;
        const recurring = [...prev.recurring];
        recurring.splice(Math.min(index, recurring.length), 0, removed);
        return { ...prev, recurring };
      }),
    );
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

  function openAddSheet() {
    setEditing(null);
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  }

  function openEditSheet(tx: Transaction) {
    setEditing(tx);
    setSheetKey((k) => k + 1);
    setSheetOpen(true);
  }

  const closeSheet = useCallback(() => setSheetOpen(false), []);

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
          monthKey={monthKey}
          onMonthChange={setMonthKey}
          totals={totals}
          categories={data.categories}
          spentByCategory={spentByCategory}
        />
      )}

      {section === "thisMonth" && (
        <ThisMonth
          monthKey={monthKey}
          onMonthChange={setMonthKey}
          transactions={monthTransactions}
          categories={data.categories}
          recurring={data.recurring}
          onEditTransaction={openEditSheet}
          onRemoveTransaction={removeTransaction}
          onStopRecurring={stopRecurring}
          onExportCsv={exportCsv}
        />
      )}

      {section === "categories" && (
        <Categories
          categories={data.categories}
          onUpdate={updateCategory}
          onRemove={removeCategory}
          onAddCategory={addCategory}
        />
      )}

      {section === "settings" && (
        <Settings user={user} theme={theme} onToggleTheme={toggleTheme} onSignOut={onSignOut} />
      )}

      <button type="button" className="fab" aria-label="Add a transaction" onClick={openAddSheet}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <Sheet open={sheetOpen} title={editing ? "Edit transaction" : "Add a transaction"} onClose={closeSheet}>
        <TransactionForm
          key={sheetKey}
          categories={data.categories}
          initial={editing ?? undefined}
          allowRepeat={!editing}
          submitLabel={editing ? "Save" : "Add"}
          onSubmit={(tx, repeat) => {
            if (editing) editTransaction(editing.id, tx);
            else addTransaction(tx, repeat);
            closeSheet();
          }}
        />
      </Sheet>

      {toast && <UndoToast message={toast.message} onUndo={handleUndo} />}
    </>
  );
}
