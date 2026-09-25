import { useState } from "react";
import type { Category } from "../types";

export function CategoryManager({
  categories,
  onAdd,
  onUpdateBudget,
  onRemove,
}: {
  categories: Category[];
  onAdd: (name: string, budget: number) => void;
  onUpdateBudget: (id: string, budget: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedBudget = Number(budget);
    if (!name.trim() || !Number.isFinite(parsedBudget) || parsedBudget < 0) return;
    onAdd(name.trim(), parsedBudget);
    setName("");
    setBudget("");
  }

  return (
    <section className="card">
      <h2>Categories</h2>
      {categories.length === 0 ? (
        <p className="empty-state">No categories yet. Add one below.</p>
      ) : (
        categories.map((c) => (
          <div className="category-row" key={c.id}>
            <span className="name">{c.name}</span>
            <div className="budget-input">
              <input
                type="number"
                min="0"
                step="1"
                value={c.budget}
                onChange={(e) => onUpdateBudget(c.id, Number(e.target.value) || 0)}
                aria-label={`Monthly budget for ${c.name}`}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={`Delete ${c.name}`}
                onClick={() => onRemove(c.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))
      )}

      <form className="inline-form" onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div className="field" style={{ flex: "2 1 140px" }}>
          <label htmlFor="cat-name">New category</label>
          <input
            id="cat-name"
            type="text"
            placeholder="e.g. Subscriptions"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cat-budget">Monthly budget</label>
          <input
            id="cat-budget"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <button type="submit" className="primary">
          Add
        </button>
      </form>
    </section>
  );
}
