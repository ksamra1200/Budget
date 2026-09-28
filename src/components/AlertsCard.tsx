import type { Alert } from "../alerts";
import { formatCurrency } from "../utils";

function whenLabel(daysUntil: number, date: string): string {
  if (daysUntil === 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long" });
  return `in ${daysUntil} days (${weekday})`;
}

function AlertIcon({ kind }: { kind: Alert["kind"] }) {
  if (kind === "bill") {
    return (
      <svg className="alert-icon bill" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    );
  }
  return (
    <svg className={`alert-icon ${kind}`} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 21h20L12 3Z" fill="currentColor" />
      <path d="M12 10v5M12 18v.5" stroke="var(--surface-1)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <section className="card alerts-card" aria-label="Alerts and reminders">
      <h2>Heads up</h2>
      <ul className="alert-list">
        {alerts.map((a) => (
          <li key={a.id} className="alert-row">
            <AlertIcon kind={a.kind} />
            <span>
              {a.kind === "bill" && (
                <>
                  <strong>{a.name}</strong> ({formatCurrency(a.amount)}) is due {whenLabel(a.daysUntil, a.date)}
                </>
              )}
              {a.kind === "over" && (
                <>
                  <strong>{a.name}</strong> is {formatCurrency(a.over)} over budget
                </>
              )}
              {a.kind === "near" && (
                <>
                  <strong>{a.name}</strong> is at {a.pct}% of its budget
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
