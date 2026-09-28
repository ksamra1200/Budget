import { MonthNav } from "../components/MonthNav";
import { TransactionList } from "../components/TransactionList";
import { RecurringList } from "../components/RecurringList";
import type { Category, RecurringRule, Transaction } from "../types";

export function ThisMonth({
  monthKey,
  onMonthChange,
  transactions,
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
  categories: Category[];
  recurring: RecurringRule[];
  onEditTransaction: (tx: Transaction) => void;
  onRemoveTransaction: (id: string) => void;
  onStopRecurring: (id: string) => void;
  onExportCsv: () => void;
}) {
  return (
    <>
      <div className="month-nav-row">
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Transactions this month</h2>
          <button type="button" className="secondary" onClick={onExportCsv}>
            Export CSV
          </button>
        </div>
        <TransactionList
          transactions={transactions}
          categories={categories}
          onEdit={onEditTransaction}
          onRemove={onRemoveTransaction}
        />
      </section>

      <RecurringList rules={recurring} categories={categories} onStop={onStopRecurring} />
    </>
  );
}
