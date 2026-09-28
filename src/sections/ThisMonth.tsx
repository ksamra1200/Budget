import { useMemo, useState } from "react";
import { MonthNav } from "../components/MonthNav";
import { TransactionList } from "../components/TransactionList";
import { RecurringList } from "../components/RecurringList";
import type { Category, RecurringRule, Transaction, TransactionType } from "../types";
import { formatCurrency } from "../utils";

type TypeFilter = "all" | TransactionType;

export function ThisMonth({
  monthKey,
  onMonthChange,
  transactions,
  allTransactions,
  categories,
  recurring,
  onEditTransaction,
  onRemoveTransaction,
  onStopRecurring,
  onExportCsv,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  transactions: Transaction[];
  allTransactions: Transaction[];
  categories: Category[];
  recurring: RecurringRule[];
  onEditTransaction: (tx: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  onStopRecurring: (id: string) => void;
  onExportCsv: () => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [allMonths, setAllMonths] = useState(false);

  const filtering = query.trim() !== "" || type !== "all" || categoryId !== "" || allMonths;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nameOf = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));
    return (allMonths ? allTransactions : transactions).filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (categoryId && t.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        t.note.toLowerCase().includes(q) ||
        (t.categoryId ? (nameOf.get(t.categoryId) ?? "").includes(q) : "income".includes(q)) ||
        String(t.amount).includes(q)
      );
    });
  }, [query, type, categoryId, allMonths, transactions, allTransactions, categories]);

  const spent = results.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const earned = results.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  function clearFilters() {
    setQuery("");
    setType("all");
    setCategoryId("");
    setAllMonths(false);
  }

  return (
    <>
      <div className="month-nav-row">
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

      <section className="card">
        <div className="card-header-row">
          <h2>{allMonths ? "All transactions" : "Transactions this month"}</h2>
          <button type="button" className="secondary" onClick={onExportCsv}>
            Export CSV
          </button>
        </div>

        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search notes, categories, amounts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search transactions"
          />
        </div>

        <div className="filter-row">
          <div className="segmented" role="group" aria-label="Transaction type">
            {(["all", "expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={type === t ? "active" : ""}
                aria-pressed={type === t}
                onClick={() => setType(t)}
              >
                {t === "all" ? "All" : t === "expense" ? "Expenses" : "Income"}
              </button>
            ))}
          </div>
          <select
            className="filter-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Untitled"}
              </option>
            ))}
          </select>
          <label className="checkbox-row filter-check">
            <input type="checkbox" checked={allMonths} onChange={(e) => setAllMonths(e.target.checked)} />
            <span>All months</span>
          </label>
        </div>

        {filtering && (
          <p className="filter-summary">
            {results.length} {results.length === 1 ? "result" : "results"}
            {spent > 0 && <> · spent {formatCurrency(spent)}</>}
            {earned > 0 && <> · earned {formatCurrency(earned)}</>}
            <button type="button" className="link-button" onClick={clearFilters}>
              Clear
            </button>
          </p>
        )}

        <TransactionList
          transactions={results}
          categories={categories}
          onEdit={onEditTransaction}
          onRemove={onRemoveTransaction}
          emptyMessage={filtering ? "No transactions match." : "No transactions yet this month."}
        />
      </section>

      <RecurringList rules={recurring} categories={categories} onStop={onStopRecurring} />
    </>
  );
}
