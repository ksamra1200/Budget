import { useState } from "react";
import type { SavingsGoal } from "../types";
import { formatCurrency } from "../utils";

export function SavingsGoals({
  goals,
  onAdd,
  onUpdateSaved,
  onRemove,
}: {
  goals: SavingsGoal[];
  onAdd: (name: string, target: number) => void;
  onUpdateSaved: (id: string, saved: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedTarget = Number(target);
    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    onAdd(name.trim(), parsedTarget);
    setName("");
    setTarget("");
  }

  return (
    <section className="card">
      <h2>Savings goals</h2>
      {goals.length === 0 ? (
        <p className="empty-state">No savings goals yet. Add one below.</p>
      ) : (
        goals.map((g) => {
          const pct = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
          const reached = g.saved >= g.target;
          return (
            <div className="meter-row" key={g.id}>
              <div className="meter-top">
                <span className="meter-name">{g.name}</span>
                <span className="meter-amounts">
                  {formatCurrency(g.saved)} of {formatCurrency(g.target)}
                </span>
              </div>
              <div
                className="meter-track"
                role="progressbar"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${g.name}: ${Math.round(pct)}% saved`}
              >
                <div className={`meter-fill ${reached ? "good" : "warning"}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="meter-status" style={{ justifyContent: "space-between", display: "flex" }}>
                <span>
                  <span className={`dot ${reached ? "good" : "warning"}`} aria-hidden="true" style={{ display: "inline-block", marginRight: 4 }} />
                  {reached ? "Goal reached" : `${Math.round(pct)}% saved`}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="amount-input-wrap compact">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={g.saved === 0 ? "" : g.saved}
                      placeholder="0"
                      onChange={(e) => onUpdateSaved(g.id, Number(e.target.value) || 0)}
                      aria-label={`Amount saved for ${g.name}`}
                      style={{
                        width: 90,
                        background: "var(--page-plane)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "4px 8px 4px 20px",
                        fontSize: 12,
                        color: "var(--text-primary)",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete ${g.name}`}
                    onClick={() => onRemove(g.id)}
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>
          );
        })
      )}

      <form className="inline-form" onSubmit={handleSubmit} style={{ marginTop: 14 }}>
        <div className="field" style={{ flex: "2 1 140px" }}>
          <label htmlFor="goal-name">New goal</label>
          <input
            id="goal-name"
            type="text"
            placeholder="e.g. Emergency fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="goal-target">Target amount</label>
          <div className="amount-input-wrap">
            <input
              id="goal-target"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="primary">
          Add
        </button>
      </form>
    </section>
  );
}
