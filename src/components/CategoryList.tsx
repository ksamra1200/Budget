import type { Category, CategoryMode } from "../types";

export function CategoryList({
  categories,
  onUpdate,
  onRemove,
}: {
  categories: Category[];
  onUpdate: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="card">
      <h2>Categories</h2>
      {categories.length === 0 ? (
        <p className="empty-state">No categories yet. Add one below.</p>
      ) : (
        categories.map((c) => (
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
              aria-label={`Behavior for ${c.name}`}
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
          </div>
        ))
      )}
    </section>
  );
}
