import { useState } from "react";
import type { CategoryMode } from "../types";

export function AddCategoryForm({
  onAdd,
}: {
  onAdd: (name: string, budget: number, mode: CategoryMode) => void;
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
      <h2>Add a category</h2>
      <form className="inline-form" onSubmit={handleSubmit}>
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
