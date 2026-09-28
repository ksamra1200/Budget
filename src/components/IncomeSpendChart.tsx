import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../utils";

export interface MonthTotals {
  key: string;
  label: string;
  income: number;
  expense: number;
}

const HEIGHT = 200;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_LEFT = 44;
const BAR_GAP = 2;
const RADIUS = 4;

/** Bar with rounded top corners only, anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return "";
  const r = Math.min(RADIUS, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(v));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * mag >= v) return step * mag;
  return 10 * mag;
}

function compact(v: number): string {
  return v >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${v}`;
}

export function IncomeSpendChart({ months }: { months: MonthTotals[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...months.map((m) => Math.max(m.income, m.expense))));
  const innerW = Math.max(0, width - PAD_LEFT);
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = months.length > 0 ? innerW / months.length : 0;
  const groupW = Math.min(slot * 0.7, 48);
  const barW = (groupW - BAR_GAP) / 2;
  const y = (v: number) => PAD_TOP + innerH - (innerH * v) / max;
  const hovered = active !== null ? months[active] : null;

  return (
    <div className="chart">
      <div className="chart-legend">
        <span className="chart-legend-item">
          <span className="chart-swatch" style={{ background: "var(--accent)" }} />
          Income
        </span>
        <span className="chart-legend-item">
          <span className="chart-swatch" style={{ background: "var(--cat-2)" }} />
          Spending
        </span>
      </div>
      <div className="chart-plot" ref={wrapRef} onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Income and spending by month">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line
                  x1={PAD_LEFT}
                  x2={width}
                  y1={y(max * f)}
                  y2={y(max * f)}
                  stroke={f === 0 ? "var(--baseline)" : "var(--gridline)"}
                  strokeWidth={1}
                />
                <text x={PAD_LEFT - 6} y={y(max * f) + 4} textAnchor="end" className="chart-axis">
                  {compact(max * f)}
                </text>
              </g>
            ))}
            {months.map((m, i) => {
              const gx = PAD_LEFT + slot * i + (slot - groupW) / 2;
              const dim = active !== null && active !== i;
              return (
                <g key={m.key} className={dim ? "chart-group dimmed" : "chart-group"}>
                  <path d={barPath(gx, y(m.income), barW, y(0) - y(m.income))} fill="var(--accent)" />
                  <path d={barPath(gx + barW + BAR_GAP, y(m.expense), barW, y(0) - y(m.expense))} fill="var(--cat-2)" />
                  <text x={PAD_LEFT + slot * i + slot / 2} y={HEIGHT - 6} textAnchor="middle" className="chart-axis">
                    {m.label}
                  </text>
                  {/* Whole-column hit area, bigger than the bars. */}
                  <rect
                    x={PAD_LEFT + slot * i}
                    y={0}
                    width={slot}
                    height={HEIGHT}
                    fill="transparent"
                    onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                    onClick={() => setActive((cur) => (cur === i ? null : i))}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {hovered && active !== null && (
          <div
            className="chart-tooltip"
            style={{
              left: PAD_LEFT + slot * active + slot / 2,
              transform: `translateX(${active === 0 ? "-20%" : active === months.length - 1 ? "-80%" : "-50%"})`,
            }}
          >
            <div className="chart-tooltip-title">{hovered.label}</div>
            <div className="chart-tooltip-row">
              <span className="chart-swatch" style={{ background: "var(--accent)" }} />
              Income <strong>{formatCurrency(hovered.income)}</strong>
            </div>
            <div className="chart-tooltip-row">
              <span className="chart-swatch" style={{ background: "var(--cat-2)" }} />
              Spending <strong>{formatCurrency(hovered.expense)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
