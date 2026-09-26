import { useState } from "react";
import type { Category, CategoryMode } from "../types";

export function CategoryManager({
  categories,
  onAdd,
  onUpdateBudget,
  onRemove,
}: {
  categories: Category[];
  onAdd: (name: string, budget: number, mode: CategoryMode) => void;
  onUpdateBudget: (id: string, budget: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [mode, setMode] = useState<CategoryMode>("fill");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedBudget = Number(budget);
    if (!name.trim() || !Number.isFinite(parsedBudget) || parsedBudget < 0) return;
    onAdd(name.trim(), parsedBudget, mode);
    setName("");
    setBudget("");
    setMode("fill");
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
              <div className="amount-input-wrap compact">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={c.budget === 0 ? "" : c.budget}
                  placeholder="0"
                  onChange={(e) => onUpdateBudget(c.id, Number(e.target.value) || 0)}
                  aria-label={`Monthly budget for ${c.name}`}
                />
              </div>
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
          <div className="amount-input-wrap">
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
        </div>
        <div className="field">
          <label htmlFor="cat-mode">Behavior</label>
          <select id="cat-mode" value={mode} onChange={(e) => setMode(e.target.value as CategoryMode)}>
            <option value="fill">Fills up as you spend</option>
            <option value="deplete">Empties as you spend</option>
          </select>
        </div>
        <button type="submit" className="primary">
          Add
        </button>
      </form>
    </section>
  );
}
