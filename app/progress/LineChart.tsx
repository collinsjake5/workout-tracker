"use client";

import { useMemo, useState } from "react";

export interface ChartPoint {
  date: string; // YYYY-MM-DD
  weight: number;
  reps: number | null;
}

function niceStep(rawStep: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
}

const WIDTH = 320;
const HEIGHT = 200;
const PAD_LEFT = 34;
const PAD_RIGHT = 14;
const PAD_TOP = 20;
const PAD_BOTTOM = 24;

export default function LineChart({ data }: { data: ChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const plot = useMemo(() => {
    const weights = data.map((d) => d.weight);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const step = niceStep(Math.max((maxW - minW) / 4, 2.5));
    const yMin = Math.floor((minW - step * 0.5) / step) * step;
    const yMax = Math.ceil((maxW + step * 0.5) / step) * step;
    const yRange = yMax - yMin || 1;

    const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const xFor = (i: number) =>
      data.length === 1 ? PAD_LEFT + innerW / 2 : PAD_LEFT + (innerW * i) / (data.length - 1);
    const yFor = (w: number) => PAD_TOP + innerH - ((w - yMin) * innerH) / yRange;

    const points = data.map((d, i) => ({ ...d, x: xFor(i), y: yFor(d.weight) }));

    const yTicks: number[] = [];
    for (let v = yMin; v <= yMax + 0.001; v += step) yTicks.push(v);

    // Show at most ~5 x-axis labels to avoid crowding.
    const labelEvery = Math.max(1, Math.ceil(data.length / 5));
    const xLabels = points.filter((_, i) => i % labelEvery === 0 || i === points.length - 1);

    return { points, yTicks, xLabels, innerH, yFor };
  }, [data]);

  const active = activeIndex !== null ? plot.points[activeIndex] : null;

  const handlePointer = (clientX: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    plot.points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  };

  return (
    <div
      className="viz-progress"
      style={{
        "--surface-1": "#fcfcfb",
        "--text-primary": "#0b0b0b",
        "--text-secondary": "#52514e",
        "--muted": "#898781",
        "--grid": "#e1e0d9",
        "--series-1": "#2a78d6",
      } as React.CSSProperties}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          .viz-progress {
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --grid: #2c2c2a;
            --series-1: #3987e5;
          }
        }
      `}</style>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        style={{ background: "var(--surface-1)" }}
        onPointerMove={(e) => handlePointer(e.clientX, e.currentTarget)}
        onPointerDown={(e) => handlePointer(e.clientX, e.currentTarget)}
        onPointerLeave={() => setActiveIndex(null)}
      >
        {plot.yTicks.map((t, i) => {
          const y = plot.yFor(t);
          return (
            <g key={i}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="var(--grid)" strokeWidth={1} />
              <text x={PAD_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="var(--muted)">
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {plot.xLabels.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={HEIGHT - 6}
            textAnchor="middle"
            fontSize={9}
            fill="var(--muted)"
          >
            {formatDate(p.date)}
          </text>
        ))}

        {plot.points.length > 1 && (
          <polyline
            points={plot.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {plot.points.map((p, i) => {
          const isLast = i === plot.points.length - 1;
          const isActive = i === activeIndex;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 6 : isLast ? 5 : 4}
                fill="var(--series-1)"
                stroke="var(--surface-1)"
                strokeWidth={2}
              />
              {isLast && (
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-primary)"
                >
                  {p.weight}lb
                </text>
              )}
            </g>
          );
        })}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD_TOP}
            y2={PAD_TOP + plot.innerH}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        )}
      </svg>

      {active && (
        <div
          className="mt-1 rounded-md px-2 py-1 text-xs"
          style={{ color: "var(--text-primary)", background: "var(--surface-1)" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>{formatDate(active.date)}: </span>
          <strong>{active.weight}lb</strong>
          {active.reps != null && <span style={{ color: "var(--text-secondary)" }}> x {active.reps}</span>}
        </div>
      )}

      <button
        onClick={() => setShowTable((s) => !s)}
        className="mt-2 text-xs underline"
        style={{ color: "var(--text-secondary)" }}
      >
        {showTable ? "Hide" : "View"} as table
      </button>

      {showTable && (
        <table className="mt-2 w-full text-xs" style={{ color: "var(--text-primary)" }}>
          <thead>
            <tr style={{ color: "var(--text-secondary)" }}>
              <th className="text-left">Date</th>
              <th className="text-right">Weight</th>
              <th className="text-right">Reps</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>{formatDate(d.date)}</td>
                <td className="text-right">{d.weight}lb</td>
                <td className="text-right">{d.reps ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
