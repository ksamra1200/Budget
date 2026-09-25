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
}: {
  name: string;
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? (spent / budget) * 100 : spent > 0 ? 100 : 0;
  const status = statusFor(pct);
  const fillWidth = Math.min(100, pct);

  return (
    <div className="meter-row">
      <div className="meter-top">
        <span className="meter-name">{name}</span>
        <span className="meter-amounts">
          {formatCurrency(spent)} of {formatCurrency(budget)}
        </span>
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
