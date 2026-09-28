import { useState } from "react";
import type { Category, CategoryRule } from "../types";

export function RulesCard({
  rules,
  categories,
  onAdd,
  onRemove,
}: {
  rules: CategoryRule[];
  categories: Category[];
  onAdd: (match: string, categoryId: string) => void;
  onRemove: (id: string) => void;
}) {
  const [match, setMatch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const selected = categoryId || categories[0]?.id || "";

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name || "Deleted category";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = match.trim();
    if (!text || !selected) return;
    onAdd(text, selected);
    setMatch("");
  }

  return (
    <section className="card">
      <h2>Auto-categorize</h2>
      <p className="card-help">
        When a new expense's note contains these words, its category is picked for you.
      </p>
      {rules.length > 0 && (
        <ul className="tx-list rule-list">
          {rules.map((r) => (
            <li className="tx-row" key={r.id}>
              <span className="tx-main">
                <span className="tx-note">"{r.match}"</span>
                <span className="tx-meta">→ {categoryName(r.categoryId)}</span>
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Delete rule for ${r.match}`}
                onClick={() => onRemove(r.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      {categories.length === 0 ? (
        <p className="empty-state">Add a category first.</p>
      ) : (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field" style={{ flex: "2 1 140px" }}>
            <label htmlFor="rule-match">Note contains</label>
            <input
              id="rule-match"
              type="text"
              placeholder="e.g. Shell"
              value={match}
              onChange={(e) => setMatch(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: "1 1 120px" }}>
            <label htmlFor="rule-category">Category</label>
            <select id="rule-category" value={selected} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || "Untitled"}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="primary">
            Add rule
          </button>
        </form>
      )}
    </section>
  );
}
