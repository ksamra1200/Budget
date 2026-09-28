import { useState } from "react";
import type { Category, CategoryMode } from "../types";
import { currentMonthKey, formatCurrency } from "../utils";

export function CategoryList({
  categories,
  onUpdate,
  onRemove,
}: {
  categories: Category[];
  onUpdate: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (categories.length === 0) {
    return (
      <section className="card">
        <h2>Categories</h2>
        <p className="empty-state">No categories yet. Add one below.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Categories</h2>
      {categories.map((c) =>
        editing ? (
          <div className="category-edit-row" key={c.id}>
            <input
              className="category-name-input"
              type="text"
              value={c.name}
              placeholder="Category name"
              onChange={(e) => onUpdate(c.id, { name: e.target.value })}
              aria-label="Category name"
            />
            <button
              type="button"
              className="icon-button"
              aria-label={`Delete ${c.name}`}
              onClick={() => onRemove(c.id)}
            >
              ✕
            </button>
            <select
              className="category-mode-select"
              value={c.mode}
              onChange={(e) => onUpdate(c.id, { mode: e.target.value as CategoryMode })}
              aria-label={`Direction for ${c.name}`}
            >
              <option value="fill">Ascending</option>
              <option value="deplete">Descending</option>
            </select>
            <div className="amount-input-wrap compact">
              <input
                className="category-budget-input"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={c.budget === 0 ? "" : c.budget}
                placeholder="0"
                onChange={(e) => onUpdate(c.id, { budget: Number(e.target.value) || 0 })}
                aria-label={`Monthly budget for ${c.name}`}
              />
            </div>
            <label className="checkbox-row category-rollover">
              <input
                type="checkbox"
                checked={!!c.rollover}
                onChange={(e) =>
                  onUpdate(
                    c.id,
                    e.target.checked
                      ? { rollover: true, rolloverFrom: currentMonthKey() }
                      : { rollover: false, rolloverFrom: undefined },
                  )
                }
              />
              <span>Roll unused money into next month</span>
            </label>
          </div>
        ) : (
          <div className="category-view-row" key={c.id}>
            <span className="category-view-name">
              {c.name || "Untitled"}
              {c.mode === "deplete" && <span className="category-mode-badge">Descending</span>}
              {c.rollover && <span className="category-mode-badge">Rolls over</span>}
            </span>
            <span className="category-view-budget">{formatCurrency(c.budget)}</span>
          </div>
        ),
      )}
      <button
        type="button"
        className={editing ? "primary edit-categories-button" : "secondary edit-categories-button"}
        onClick={() => setEditing((e) => !e)}
      >
        {editing ? "Done" : "Edit categories"}
      </button>
    </section>
  );
}
