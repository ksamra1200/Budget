import type { Category, RecurringRule } from "../types";
import { formatCurrency, ordinal } from "../utils";

export function RecurringList({
  rules,
  categories,
  onStop,
}: {
  rules: RecurringRule[];
  categories: Category[];
  onStop: (id: string) => void;
}) {
  const categoryName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <section className="card">
      <h2>Recurring</h2>
      {rules.length === 0 ? (
        <p className="empty-state">
          Nothing recurring yet. Tick "Repeat every month" when adding a transaction.
        </p>
      ) : (
        <ul className="tx-list">
          {rules.map((r) => (
            <li className="tx-row" key={r.id}>
              <span className="tx-main">
                <span className="tx-note">{r.note || (r.type === "income" ? "Income" : categoryName(r.categoryId))}</span>
                <span className="tx-meta">
                  {r.type === "income" ? "Income" : categoryName(r.categoryId)} · every month on the{" "}
                  {ordinal(r.dayOfMonth)}
                </span>
              </span>
              <span className={`tx-amount ${r.type}`}>
                {r.type === "income" ? "+" : "−"}
                {formatCurrency(r.amount)}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Stop recurring ${r.note || categoryName(r.categoryId)}`}
                onClick={() => onStop(r.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
