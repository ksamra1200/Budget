import { useRef, useState } from "react";
import type { Category, CategoryMode } from "../types";
import type { MonthBudget } from "../rollover";
import { formatCurrency } from "../utils";

// Part-to-whole reads at a glance only up to ~6 segments; the rest fold into "Other".
const MAX_SEGMENTS = 6;
const CENTER = 110;
const RADIUS = 86;
const THICKNESS = 22;
// 2px surface-colored gap between segments, measured along the ring's centerline.
const GAP = 2 / RADIUS;

interface Segment {
  key: string;
  name: string;
  color: string;
  budget: number;
  spent: number;
  mode: CategoryMode;
}

function fillFraction(s: Segment): number {
  const used = s.spent / s.budget;
  return s.mode === "deplete" ? Math.max(0, 1 - used) : Math.min(1, used);
}

// Angles in radians, 0 at 12 o'clock, increasing clockwise.
function arcPath(start: number, end: number): string {
  const x0 = CENTER + RADIUS * Math.sin(start);
  const y0 = CENTER - RADIUS * Math.cos(start);
  const x1 = CENTER + RADIUS * Math.sin(end);
  const y1 = CENTER - RADIUS * Math.cos(end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function buildSegments(
  categories: Category[],
  spentByCategory: Map<string, number>,
  budgets: Map<string, MonthBudget>,
): Segment[] {
  const budgetOf = (c: Category) => budgets.get(c.id)?.budget ?? c.budget;
  const withBudget = categories.filter((c) => budgetOf(c) > 0);
  const toSegment = (c: Category, i: number): Segment => ({
    key: c.id,
    name: c.name || "Untitled",
    color: `var(--cat-${i + 1})`,
    budget: budgetOf(c),
    spent: spentByCategory.get(c.id) ?? 0,
    mode: c.mode,
  });
  if (withBudget.length <= MAX_SEGMENTS) return withBudget.map(toSegment);

  const shown = withBudget.slice(0, MAX_SEGMENTS - 1).map(toSegment);
  const rest = withBudget.slice(MAX_SEGMENTS - 1);
  shown.push({
    key: "__other",
    name: `Other (${rest.length})`,
    color: "var(--cat-other)",
    budget: rest.reduce((sum, c) => sum + budgetOf(c), 0),
    spent: rest.reduce((sum, c) => sum + (spentByCategory.get(c.id) ?? 0), 0),
    mode: "fill",
  });
  return shown;
}

function WarningIcon() {
  return (
    <svg className="status-icon" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 21h20L12 3Z" fill="var(--status-critical)" />
      <path d="M12 10v5M12 18v.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function BudgetDonut({
  categories,
  spentByCategory,
  budgets,
}: {
  categories: Category[];
  spentByCategory: Map<string, number>;
  budgets: Map<string, MonthBudget>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const lastPointer = useRef<string>("mouse");

  if (categories.length === 0) {
    return <p className="empty-state">Add a category from the Categories page to see your budget here.</p>;
  }

  const segments = buildSegments(categories, spentByCategory, budgets);
  if (segments.length === 0) {
    return <p className="empty-state">Give your categories a budget amount to see them here.</p>;
  }

  const totalBudget = segments.reduce((sum, s) => sum + s.budget, 0);
  const totalSpent = segments.reduce((sum, s) => sum + s.spent, 0);

  let cursor = 0;
  const arcs = segments.map((s) => {
    const span = (s.budget / totalBudget) * Math.PI * 2;
    const start = cursor + GAP / 2;
    const end = cursor + span - GAP / 2;
    cursor += span;
    return { segment: s, start, end, fill: fillFraction(s) };
  });

  const active = segments.find((s) => s.key === selected) ?? null;

  function hoverIn(key: string) {
    if (lastPointer.current === "mouse") setSelected(key);
  }
  function hoverOut() {
    if (lastPointer.current === "mouse") setSelected(null);
  }
  function tap(key: string) {
    if (lastPointer.current === "mouse") return;
    setSelected((cur) => (cur === key ? null : key));
  }

  const summary = segments
    .map((s) => `${s.name}: ${formatCurrency(s.spent)} of ${formatCurrency(s.budget)}`)
    .join("; ");

  return (
    <div className="donut">
      <div className="donut-wrap">
        <svg viewBox="0 0 220 220" className="donut-svg" role="img" aria-label={`Budget by category. ${summary}`}>
          {arcs.map(({ segment, start, end, fill }) => {
            const dimmed = active !== null && active.key !== segment.key;
            return (
              <g
                key={segment.key}
                className={`donut-segment${dimmed ? " dimmed" : ""}${active?.key === segment.key ? " active" : ""}`}
                tabIndex={0}
                role="button"
                aria-label={`${segment.name}: ${formatCurrency(segment.spent)} of ${formatCurrency(segment.budget)}`}
                onPointerDown={(e) => (lastPointer.current = e.pointerType)}
                onPointerEnter={(e) => {
                  lastPointer.current = e.pointerType;
                  hoverIn(segment.key);
                }}
                onPointerLeave={hoverOut}
                onClick={() => tap(segment.key)}
                onFocus={(e) => {
                  // Keyboard focus only; a tap also fires focus and would cancel out the click's toggle.
                  if (e.currentTarget.matches(":focus-visible")) setSelected(segment.key);
                }}
                onBlur={() => setSelected(null)}
              >
                <path d={arcPath(start, end)} className="donut-track" style={{ stroke: segment.color }} strokeWidth={THICKNESS} fill="none" />
                {/* Full-length arc revealed by its dash, so the fill animates as spending changes. */}
                <path
                  d={arcPath(start, end)}
                  className="donut-fill"
                  pathLength={1}
                  style={{ stroke: segment.color, strokeDasharray: `${fill} 1` }}
                  strokeWidth={THICKNESS}
                  fill="none"
                />
                {/* Wider invisible stroke so the tap target is bigger than the painted ring. */}
                <path d={arcPath(start, end)} stroke="transparent" strokeWidth={THICKNESS + 18} fill="none" />
              </g>
            );
          })}
        </svg>

        <div className="donut-center" aria-live="polite">
          {active ? (
            <>
              <span className="donut-center-label">{active.name}</span>
              <span className="donut-center-value">
                {formatCurrency(active.mode === "deplete" ? Math.max(0, active.budget - active.spent) : active.spent)}
              </span>
              <span className="donut-center-sub">
                {active.mode === "deplete" ? "left of " : "of "}
                {formatCurrency(active.budget)}
              </span>
              {active.spent > active.budget && (
                <span className="donut-center-status">
                  <WarningIcon /> Over budget
                </span>
              )}
            </>
          ) : (
            <>
              <span className="donut-center-label">Spent</span>
              <span className="donut-center-value">{formatCurrency(totalSpent)}</span>
              <span className="donut-center-sub">of {formatCurrency(totalBudget)}</span>
            </>
          )}
        </div>
      </div>

      <ul className="donut-legend">
        {segments.map((s) => {
          const pct = Math.round((s.spent / s.budget) * 100);
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`donut-legend-item${selected === s.key ? " active" : ""}`}
                onClick={() => setSelected((cur) => (cur === s.key ? null : s.key))}
              >
                <span className="donut-swatch" style={{ background: s.color }} />
                <span className="donut-legend-name">{s.name}</span>
                <span className="donut-legend-pct">
                  {s.spent > s.budget && <WarningIcon />}
                  {pct}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
