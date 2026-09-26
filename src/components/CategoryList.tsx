import type { Category } from "../types";

export function CategoryList({
  categories,
  onUpdateBudget,
  onRemove,
}: {
  categories: Category[];
  onUpdateBudget: (id: string, budget: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="card">
      <h2>Categories</h2>
      {categories.length === 0 ? (
        <p className="empty-state">No categories yet. Add one below.</p>
      ) : (
        categories.map((c) => (
          <div className="category-row" key={c.id}>
            <span className="name">
              {c.name}
              {c.mode === "deplete" && <span className="category-mode-badge">Descending</span>}
            </span>
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
    </section>
  );
}
