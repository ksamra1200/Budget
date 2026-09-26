import { MonthNav } from "../components/MonthNav";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import type { Category, Transaction, TransactionType } from "../types";

export function ThisMonth({
  monthKey,
  onMonthChange,
  transactions,
  categories,
  onAddTransaction,
  onRemoveTransaction,
  onExportCsv,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (tx: {
    date: string;
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    note: string;
  }) => void;
  onRemoveTransaction: (id: string) => void;
  onExportCsv: () => void;
}) {
  return (
    <>
      <div className="app-header" style={{ padding: "4px 0 16px" }}>
        <h2 style={{ margin: 0 }}>This Month</h2>
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

      <section className="card">
        <h2>Add a transaction</h2>
        <TransactionForm categories={categories} onAdd={onAddTransaction} />
      </section>

      <section className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Transactions this month</h2>
          <button type="button" className="secondary" onClick={onExportCsv}>
            Export CSV
          </button>
        </div>
        <TransactionList transactions={transactions} categories={categories} onRemove={onRemoveTransaction} />
      </section>
    </>
  );
}
