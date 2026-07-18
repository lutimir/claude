import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatPrice } from "@/lib/format";
import type { PriceDrop } from "@/lib/queries";

export async function PriceDropCard({ drop }: { drop: PriceDrop }) {
  const t = await getTranslations("common");
  return (
    <Link
      href={`/produkt/${drop.slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-500/50 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <span className="absolute right-3 top-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
        −{drop.dropPct.toLocaleString("sk-SK")} %
      </span>
      <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {drop.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={drop.imageUrl}
            alt={drop.name}
            className="h-full w-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-3xl font-bold text-neutral-300 dark:text-neutral-600">
            {drop.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {drop.brandName ? (
          <p className="text-xs uppercase tracking-wide text-neutral-500">{drop.brandName}</p>
        ) : null}
        <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
          {drop.name}
        </h3>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
          {formatPrice(drop.currentPrice)}
        </p>
        <p className="text-sm text-neutral-400 line-through">{formatPrice(drop.fairPrice)}</p>
        <p className="ml-auto text-xs text-neutral-500">
          {t("offersCount", { count: drop.offerCount })}
        </p>
      </div>
    </Link>
  );
}
