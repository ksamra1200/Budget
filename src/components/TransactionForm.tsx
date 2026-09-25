import { useState } from "react";
import type { Category, TransactionType } from "../types";
import { todayISO } from "../utils";

export function TransactionForm({
  categories,
  onAdd,
}: {
  categories: Category[];
  onAdd: (tx: {
    date: string;
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    note: string;
  }) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    if (type === "expense" && !categoryId) return;

    onAdd({
      date,
      type,
      amount: parsedAmount,
      categoryId: type === "income" ? null : categoryId,
      note: note.trim(),
    });

    setAmount("");
    setNote("");
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <div className="field" style={{ flex: "1 1 100px" }}>
        <label htmlFor="tx-type">Type</label>
        <select
          id="tx-type"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {type === "expense" && (
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label htmlFor="tx-category">Category</label>
          <select id="tx-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field" style={{ flex: "1 1 100px" }}>
        <label htmlFor="tx-amount">Amount</label>
        <input
          id="tx-amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="field" style={{ flex: "1 1 130px" }}>
        <label htmlFor="tx-date">Date</label>
        <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="field" style={{ flex: "2 1 160px" }}>
        <label htmlFor="tx-note">Note</label>
        <input
          id="tx-note"
          type="text"
          placeholder="Optional"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button type="submit" className="primary">
        Add
      </button>
    </form>
  );
}
