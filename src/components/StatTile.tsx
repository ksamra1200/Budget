import { formatCurrency } from "../utils";

export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="stat-tile">
      <p className="label">{label}</p>
      <p className={`value${tone ? ` ${tone}` : ""}`}>{formatCurrency(value)}</p>
    </div>
  );
}
