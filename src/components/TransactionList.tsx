import type { Category, Transaction } from "../types";
import { formatCurrency } from "../utils";

export function TransactionList({
  transactions,
  categories,
  onRemove,
}: {
  transactions: Transaction[];
  categories: Category[];
  onRemove: (id: string) => void;
}) {
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  if (transactions.length === 0) {
    return <p className="empty-state">No transactions yet this month.</p>;
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="tx-list">
      {sorted.map((tx) => (
        <li className="tx-row" key={tx.id}>
          <div className="tx-main">
            <span className="tx-note">{tx.note || categoryName(tx.categoryId)}</span>
            <span className="tx-meta">
              {tx.date} · {tx.type === "income" ? "Income" : categoryName(tx.categoryId)}
            </span>
          </div>
          <span className={`tx-amount ${tx.type}`}>
            {tx.type === "income" ? "+" : "−"}
            {formatCurrency(tx.amount)}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Delete transaction"
            onClick={() => onRemove(tx.id)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
