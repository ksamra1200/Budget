import { useState } from "react";
import type { SavingsGoal } from "../types";
import { currentMonthKey, formatCurrency, formatMonthLabel } from "../utils";

function monthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

/** How much to put away each month to hit the target by its month (inclusive of this one). */
function monthlyNeeded(goal: SavingsGoal): { perMonth: number; months: number } | null {
  if (!goal.targetMonth) return null;
  const months = monthsBetween(currentMonthKey(), goal.targetMonth) + 1;
  const left = Math.max(0, goal.target - goal.saved);
  if (months <= 0) return { perMonth: left, months: 0 };
  return { perMonth: left / months, months };
}

function GoalRow({
  goal,
  onContribute,
  onRemove,
}: {
  goal: SavingsGoal;
  onContribute: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  const reached = goal.saved >= goal.target && goal.target > 0;
  const plan = monthlyNeeded(goal);

  function apply(sign: 1 | -1) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    onContribute(goal.id, sign * value);
    setAmount("");
  }

  return (
    <div className="goal-row">
      <div className="meter-top">
        <span className="meter-name">{goal.name}</span>
        <span className="meter-amounts">
          {formatCurrency(goal.saved)} of {formatCurrency(goal.target)}
        </span>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name}: ${Math.round(pct)}% saved`}
      >
        <div className="meter-fill goal" style={{ width: `${pct}%` }} />
      </div>
      <p className="goal-plan">
        {reached ? (
          <span className="goal-reached">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5 10 17 19 7" />
            </svg>
            Goal reached
          </span>
        ) : plan ? (
          plan.months <= 0 ? (
            <>Target month has passed · {formatCurrency(goal.target - goal.saved)} to go</>
          ) : (
            <>
              Save {formatCurrency(Math.ceil(plan.perMonth))}/mo to reach it by{" "}
              {formatMonthLabel(goal.targetMonth!)}
            </>
          )
        ) : (
          <>{Math.round(pct)}% saved · {formatCurrency(goal.target - goal.saved)} to go</>
        )}
      </p>
      <div className="goal-actions">
        <div className="amount-input-wrap compact">
          <input
            type="number"
            min="0"
            step="1"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label={`Amount for ${goal.name}`}
          />
        </div>
        <button type="button" className="primary" onClick={() => apply(1)}>
          Add
        </button>
        <button type="button" className="secondary" onClick={() => apply(-1)}>
          Take out
        </button>
        <button
          type="button"
          className="icon-button goal-delete"
          aria-label={`Delete goal ${goal.name}`}
          onClick={() => onRemove(goal.id)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function Goals({
  goals,
  onAdd,
  onContribute,
  onRemove,
}: {
  goals: SavingsGoal[];
  onAdd: (goal: Omit<SavingsGoal, "id">) => void;
  onContribute: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [targetMonth, setTargetMonth] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    const s = saved === "" ? 0 : Number(saved);
    if (!name.trim()) return setError("Give your goal a name.");
    if (!Number.isFinite(t) || t <= 0) return setError("Enter a target amount greater than zero.");
    if (!Number.isFinite(s) || s < 0) return setError("Amount already saved can't be negative.");
    setError(null);
    onAdd({ name: name.trim(), target: t, saved: s, targetMonth: targetMonth || undefined });
    setName("");
    setTarget("");
    setSaved("");
    setTargetMonth("");
  }

  return (
    <>
      <section className="card">
        <div className="card-header-row">
          <h2>Savings goals</h2>
          {goals.length > 0 && <span className="card-header-meta">{formatCurrency(totalSaved)} saved</span>}
        </div>
        {goals.length === 0 ? (
          <p className="empty-state">
            No goals yet. Add one below, like an emergency fund or a trip.
          </p>
        ) : (
          goals.map((g) => <GoalRow key={g.id} goal={g} onContribute={onContribute} onRemove={onRemove} />)
        )}
      </section>

      <section className="card">
        <h2>Add a goal</h2>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field" style={{ flex: "1 1 100%" }}>
            <label htmlFor="goal-name">Goal</label>
            <input
              id="goal-name"
              type="text"
              placeholder="e.g. Emergency fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="goal-target">Target</label>
            <div className="amount-input-wrap">
              <input id="goal-target" type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="goal-saved">Already saved</label>
            <div className="amount-input-wrap">
              <input id="goal-saved" type="number" min="0" step="1" inputMode="decimal" placeholder="0" value={saved} onChange={(e) => setSaved(e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ flex: "1 1 100%" }}>
            <label htmlFor="goal-month">Reach it by (optional)</label>
            <input id="goal-month" type="month" min={currentMonthKey()} value={targetMonth} onChange={(e) => setTargetMonth(e.target.value)} />
          </div>
          {error && <p className="auth-error form-error">{error}</p>}
          <button type="submit" className="primary">
            Add goal
          </button>
        </form>
      </section>
    </>
  );
}
