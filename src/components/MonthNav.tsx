import { formatMonthLabel, shiftMonth } from "../utils";

export function MonthNav({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="month-nav">
      <button aria-label="Previous month" onClick={() => onChange(shiftMonth(monthKey, -1))}>
        ‹
      </button>
      <span className="month-label">{formatMonthLabel(monthKey)}</span>
      <button aria-label="Next month" onClick={() => onChange(shiftMonth(monthKey, 1))}>
        ›
      </button>
    </div>
  );
}
