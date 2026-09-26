import { MonthNav } from "../components/MonthNav";
import { TransactionList } from "../components/TransactionList";
import type { Category, Transaction } from "../types";

export function ThisMonth({
  monthKey,
  onMonthChange,
  transactions,
  categories,
  onRemoveTransaction,
  onExportCsv,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  transactions: Transaction[];
  categories: Category[];
  onRemoveTransaction: (id: string) => void;
  onExportCsv: () => void;
}) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 16px" }}>
        <MonthNav monthKey={monthKey} onChange={onMonthChange} />
      </div>

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
