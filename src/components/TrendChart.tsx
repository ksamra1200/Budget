import { useRef, useState } from "react";
import { formatCurrency } from "../utils";

export interface MonthlyTotal {
  key: string;
  label: string;
  income: number;
  expense: number;
}

const VIEW_W = 600;
const VIEW_H = 200;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

export function TrendChart({ months }: { months: MonthlyTotal[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (months.length < 2) {
    return <p className="empty-state">Add transactions across a few months to see a trend.</p>;
  }

  const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const maxValue = Math.max(1, ...months.map((m) => Math.max(m.income, m.expense)));

  const xAt = (i: number) => PAD_LEFT + (innerW * i) / (months.length - 1);
  const yAt = (v: number) => PAD_TOP + innerH - (innerH * v) / maxValue;

  const incomePoints = months.map((m, i) => [xAt(i), yAt(m.income)] as const);
  const expensePoints = months.map((m, i) => [xAt(i), yAt(m.expense)] as const);
  const toPath = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const gridLines = [0, 0.5, 1];

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = VIEW_W / rect.width;
    const localX = (e.clientX - rect.left) * scaleX;
    const step = innerW / (months.length - 1);
    const idx = Math.round((localX - PAD_LEFT) / step);
    setHover(Math.max(0, Math.min(months.length - 1, idx)));
  }

  const hovered = hover !== null ? months[hover] : null;
  const hoveredXPct = hover !== null ? (xAt(hover) / VIEW_W) * 100 : 0;

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span className="item">
          <span className="swatch" style={{ background: "var(--series-1)" }} />
          Income
        </span>
        <span className="item">
          <span className="swatch" style={{ background: "var(--series-2)" }} />
          Expenses
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height={VIEW_H}
        role="img"
        aria-label="Monthly income and expenses trend"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {gridLines.map((g) => (
          <line
            key={g}
            x1={PAD_LEFT}
            x2={VIEW_W - PAD_RIGHT}
            y1={PAD_TOP + innerH * (1 - g)}
            y2={PAD_TOP + innerH * (1 - g)}
            stroke="var(--gridline)"
            strokeWidth={1}
          />
        ))}
        <line
          x1={PAD_LEFT}
          x2={VIEW_W - PAD_RIGHT}
          y1={PAD_TOP + innerH}
          y2={PAD_TOP + innerH}
          stroke="var(--baseline)"
          strokeWidth={1}
        />

        {hover !== null && (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={PAD_TOP}
            y2={PAD_TOP + innerH}
            stroke="var(--baseline)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        <path d={toPath(incomePoints)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={toPath(expensePoints)} fill="none" stroke="var(--series-2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {incomePoints.map(([x, y], i) => (
          <circle key={`i-${i}`} cx={x} cy={y} r={i === hover ? 5 : 3} fill="var(--series-1)" />
        ))}
        {expensePoints.map(([x, y], i) => (
          <circle key={`e-${i}`} cx={x} cy={y} r={i === hover ? 5 : 3} fill="var(--series-2)" />
        ))}

        {months.map((m, i) => (
          <text
            key={m.key}
            x={xAt(i)}
            y={VIEW_H - 6}
            textAnchor="middle"
            className="chart-axis-label"
          >
            {m.label}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="chart-tooltip"
          style={{
            left: `${hoveredXPct}%`,
            top: 4,
            transform: `translateX(${hoveredXPct > 70 ? "-100%" : hoveredXPct < 15 ? "0%" : "-50%"})`,
          }}
        >
          <div className="tt-month">{hovered.label}</div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: "var(--series-1)" }} />
            Income {formatCurrency(hovered.income)}
          </div>
          <div className="tt-row">
            <span className="tt-dot" style={{ background: "var(--series-2)" }} />
            Expenses {formatCurrency(hovered.expense)}
          </div>
        </div>
      )}
    </div>
  );
}
