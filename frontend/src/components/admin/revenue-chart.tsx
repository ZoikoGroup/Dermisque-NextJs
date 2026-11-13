"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";

type Point = { date: string; revenue: number; orders: number };

const W = 760;
const H = 240;
const PAD = { top: 12, right: 8, bottom: 26, left: 52 };

/** Single-series daily revenue bars with a per-bar hover tooltip. */
export function RevenueChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const nice = useMemo(() => {
    const raw = max / 100 / 4; // dollars per gridline
    const mag = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
    const step = Math.ceil(raw / mag) * mag;
    return { step: step * 100, top: step * 100 * 4 };
  }, [max]);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const gap = Math.min(2, slot * 0.2);
  const barW = Math.max(1, slot - gap);
  const y = (v: number) => PAD.top + innerH - (v / nice.top) * innerH;
  const labelEvery = Math.ceil(data.length / 8);
  const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily revenue">
        {[0, 1, 2, 3, 4].map((i) => {
          const v = nice.step * i;
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#ebe7e0" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(v) + 4} textAnchor="end" className="fill-mute text-[11px]">
                ${(v / 100).toLocaleString()}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = PAD.left + i * slot + gap / 2;
          const top = y(d.revenue);
          const hgt = Math.max(0, PAD.top + innerH - top);
          const r = Math.min(4, barW / 2, hgt);
          return (
            <g key={d.date}>
              {hgt > 0 && (
                <path
                  d={`M${x},${PAD.top + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${PAD.top + innerH} Z`}
                  fill={hover === i ? "#0b0b0f" : "#07a9cc"}
                  className="transition-colors duration-150"
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" className="fill-mute text-[11px]">
                  {fmtDay(d.date)}
                </text>
              )}
              {/* hit target wider than the mark */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
      </svg>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%` }}
        >
          <p className="font-medium">{fmtDay(h.date)}</p>
          <p className="mt-0.5 text-ink-soft">
            Revenue <b className="text-ink">{formatPrice(h.revenue)}</b>
          </p>
          <p className="text-ink-soft">
            Orders <b className="text-ink">{h.orders}</b>
          </p>
        </div>
      )}
    </div>
  );
}
