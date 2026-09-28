import { useState } from "react";
import type { Category, CategoryRule, TransactionInput, TransactionType } from "../types";
import { ordinal, todayISO } from "../utils";

export function TransactionForm({
  categories,
  rules,
  initial,
  allowRepeat,
  submitLabel,
  onSubmit,
}: {
  categories: Category[];
  rules: CategoryRule[];
  initial?: TransactionInput;
  allowRepeat: boolean;
  submitLabel: string;
  onSubmit: (tx: TransactionInput, repeat: boolean) => void;
}) {
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState<string>(
    initial?.categoryId ?? categories[0]?.id ?? "",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Once the category is picked by hand (or we're editing), rules stop overriding it.
  const [categoryTouched, setCategoryTouched] = useState(!!initial);
  const [ruleHit, setRuleHit] = useState<string | null>(null);

  function handleNoteChange(value: string) {
    setNote(value);
    if (categoryTouched) return;
    const text = value.toLowerCase();
    const rule = text
      ? rules.find(
          (r) => r.match && text.includes(r.match.toLowerCase()) && categories.some((c) => c.id === r.categoryId),
        )
      : undefined;
    if (rule) {
      setCategoryId(rule.categoryId);
      setRuleHit(rule.match);
    } else if (ruleHit) {
      setRuleHit(null);
    }
  }

  const day = Number(date.slice(8, 10));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!date) {
      setError("Pick a date.");
      return;
    }
    if (type === "expense" && !categoryId) {
      setError("Add a category on the Categories page first.");
      return;
    }
    setError(null);
    onSubmit(
      {
        date,
        type,
        amount: parsedAmount,
        categoryId: type === "income" ? null : categoryId,
        note: note.trim(),
      },
      allowRepeat && repeat,
    );
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <div className="field" style={{ flex: "1 1 100px" }}>
        <label htmlFor="tx-type">Type</label>
        <select id="tx-type" value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </div>

      {type === "expense" && (
        <div className="field" style={{ flex: "1 1 140px" }}>
          <label htmlFor="tx-category">Category</label>
          <select
            id="tx-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setCategoryTouched(true);
              setRuleHit(null);
            }}
          >
            {categories.length === 0 && <option value="">No categories yet</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {ruleHit && <span className="field-hint">Picked by your "{ruleHit}" rule</span>}
        </div>
      )}

      <div className="field" style={{ flex: "1 1 100px" }}>
        <label htmlFor="tx-amount">Amount</label>
        <div className="amount-input-wrap">
          <input
            id="tx-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
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
          onChange={(e) => handleNoteChange(e.target.value)}
        />
      </div>

      {allowRepeat && (
        <label className="checkbox-row">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
          <span>
            Repeat every month{day > 0 ? ` on the ${ordinal(day)}` : ""}
          </span>
        </label>
      )}

      {error && <p className="auth-error form-error">{error}</p>}

      <button type="submit" className="primary">
        {submitLabel}
      </button>
    </form>
  );
}
