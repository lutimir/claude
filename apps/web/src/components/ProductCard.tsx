import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { CompareToggle } from "@/components/CompareToggle";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";

export async function ProductCard({ product }: { product: ProductCardData }) {
  const t = await getTranslations("common");
  return (
    <Link
      href={`/produkt/${product.slug}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-emerald-500/50 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Suspense fallback={null}>
        <CompareToggle
          productId={product.id}
          label={t("compareToggle")}
          activeLabel={t("inCompare")}
        />
      </Suspense>
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-3xl font-bold text-neutral-300 dark:text-neutral-600">
            {product.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {product.brandName ? (
          <p className="text-xs uppercase tracking-wide text-neutral-500">{product.brandName}</p>
        ) : null}
        <h3 className="line-clamp-2 font-medium leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
          {product.name}
        </h3>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
          {product.minPrice ? t("fromPrice", { price: formatPrice(product.minPrice) }) : t("noOffers")}
        </p>
        <p className="text-xs text-neutral-500">{t("offersCount", { count: product.offerCount })}</p>
      </div>
    </Link>
  );
}
