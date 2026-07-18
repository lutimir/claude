"use client";

import { useState } from "react";
import type { PricePoint } from "@/lib/queries";

interface InteractivePriceChartProps {
  points: PricePoint[];
  emptyLabel: string;
  minLabel: string;
  avgLabel: string;
}

const WIDTH = 640;
const HEIGHT = 200;
const PAD = 12;

const priceFormat = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });
const dayFormat = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "short" });

/** Interaktívny graf vývoja cien — čistý SVG bez knižníc, tooltip na pointer. */
export function InteractivePriceChart({
  points,
  emptyLabel,
  minLabel,
  avgLabel,
}: InteractivePriceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length < 2) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
  }

  const prices = points.map((point) => point.min);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const x = (index: number) => PAD + (index / (points.length - 1)) * (WIDTH - 2 * PAD);
  const y = (price: number) => HEIGHT - PAD - ((price - min) / span) * (HEIGHT - 2 * PAD);

  const line = points
    .map((point, index) => `${x(index).toFixed(1)},${y(point.min).toFixed(1)}`)
    .join(" ");
  const area = `${PAD},${HEIGHT - PAD} ${line} ${WIDTH - PAD},${HEIGHT - PAD}`;

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round(((svgX - PAD) / (WIDTH - 2 * PAD)) * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  const hovered = hoverIndex === null ? null : points[hoverIndex]!;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none select-none"
        role="img"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <polygon points={area} className="fill-emerald-500/10" />
        <polyline
          points={line}
          className="fill-none stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hoverIndex !== null && hovered ? (
          <>
            <line
              x1={x(hoverIndex)}
              x2={x(hoverIndex)}
              y1={PAD}
              y2={HEIGHT - PAD}
              className="stroke-neutral-400/60"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hoverIndex)}
              cy={y(hovered.min)}
              r={4.5}
              className="fill-emerald-600 dark:fill-emerald-400"
            />
          </>
        ) : (
          <circle
            cx={x(points.length - 1)}
            cy={y(points[points.length - 1]!.min)}
            r={4}
            className="fill-emerald-600 dark:fill-emerald-400"
          />
        )}
      </svg>

      {hoverIndex !== null && hovered ? (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md dark:border-neutral-700 dark:bg-neutral-900"
          style={{
            left: `${(x(hoverIndex) / WIDTH) * 100}%`,
          }}
        >
          <p className="font-medium">{dayFormat.format(new Date(`${hovered.day}T00:00:00`))}</p>
          <p className="mt-0.5 whitespace-nowrap text-emerald-700 dark:text-emerald-400">
            {minLabel}: <span className="font-semibold">{priceFormat.format(hovered.min)}</span>
          </p>
          <p className="whitespace-nowrap text-neutral-500">
            {avgLabel}: {priceFormat.format(hovered.avg)}
          </p>
        </div>
      ) : null}

      <div className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{dayFormat.format(new Date(`${points[0]!.day}T00:00:00`))}</span>
        <span>
          min {priceFormat.format(min)} · max {priceFormat.format(max)}
        </span>
        <span>{dayFormat.format(new Date(`${points[points.length - 1]!.day}T00:00:00`))}</span>
      </div>
    </div>
  );
}
