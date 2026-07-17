import { formatDay, formatPrice } from "@/lib/format";
import type { PricePoint } from "@/lib/queries";

interface PriceHistoryChartProps {
  points: PricePoint[];
  emptyLabel: string;
}

/** Serverovo renderovaný SVG graf — žiadny klientsky JavaScript. */
export function PriceHistoryChart({ points, emptyLabel }: PriceHistoryChartProps) {
  if (points.length < 2) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
  }

  const width = 640;
  const height = 180;
  const padding = 10;
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;

  const x = (index: number) => padding + (index / (points.length - 1)) * (width - 2 * padding);
  const y = (price: number) => height - padding - ((price - min) / span) * (height - 2 * padding);

  const line = points
    .map((point, index) => `${x(index).toFixed(1)},${y(point.price).toFixed(1)}`)
    .join(" ");
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;
  const last = points[points.length - 1]!;

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={emptyLabel}>
        <polygon points={area} className="fill-emerald-500/10" />
        <polyline
          points={line}
          className="fill-none stroke-emerald-600 dark:stroke-emerald-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(last.price)}
          r={4}
          className="fill-emerald-600 dark:fill-emerald-400"
        />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{formatDay(points[0]!.day)}</span>
        <span>
          min {formatPrice(min)} · max {formatPrice(max)}
        </span>
        <span>{formatDay(last.day)}</span>
      </figcaption>
    </figure>
  );
}
