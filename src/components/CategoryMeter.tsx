import type { CategoryMode } from "../types";
import { formatCurrency } from "../utils";

function statusFor(pct: number): { key: "good" | "warning" | "critical"; label: string } {
  if (pct > 100) return { key: "critical", label: "Over budget" };
  if (pct >= 80) return { key: "warning", label: "Near limit" };
  return { key: "good", label: "On track" };
}

export function CategoryMeter({
  name,
  spent,
  budget,
  mode,
}: {
  name: string;
  spent: number;
  budget: number;
  mode: CategoryMode;
}) {
  const pct = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
  const status = statusFor(pct);
  const remaining = Math.max(0, budget - spent);

  const fillWidth =
    mode === "deplete"
      ? budget > 0
        ? Math.min(100, (remaining / budget) * 100)
        : spent > 0
          ? 0
          : 100
      : Math.min(100, pct);

  const amountsLabel =
    mode === "deplete"
      ? `${formatCurrency(remaining)} left of ${formatCurrency(budget)}`
      : `${formatCurrency(spent)} of ${formatCurrency(budget)}`;

  return (
    <div className="meter-row">
      <div className="meter-top">
        <span className="meter-name">{name}</span>
        <span className="meter-amounts">{amountsLabel}</span>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${name}: ${status.label}, ${Math.round(pct)}% of budget used`}
      >
        <div className={`meter-fill ${status.key}`} style={{ width: `${fillWidth}%` }} />
      </div>
      <div className="meter-status">
        <span className={`dot ${status.key}`} aria-hidden="true" />
        <span>
          {status.label} · {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}
