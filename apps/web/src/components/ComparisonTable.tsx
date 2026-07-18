import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ComparisonRow } from "@app0/core";
import { currencyForLocale } from "@/lib/currency";
import { formatPrice } from "@/lib/format";
import type { ComparisonProduct } from "@/lib/queries";

interface ComparisonTableProps {
  products: ComparisonProduct[];
  rows: ComparisonRow[];
  /** Odkazy na odobratie produktu (len na /porovnat?ids=…) */
  removeLinks?: Record<number, string>;
}

export async function ComparisonTable({ products, rows, removeLinks }: ComparisonTableProps) {
  const t = await getTranslations("compare");
  const tCommon = await getTranslations("common");
  const currency = currencyForLocale(await getLocale());

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-white align-top dark:border-neutral-800 dark:bg-neutral-900">
            <th className="w-40 px-4 py-3" />
            {products.map((product) => (
              <th key={product.id} className="px-4 py-3 text-left font-normal">
                <div className="flex h-24 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-neutral-300 dark:text-neutral-600">
                      {product.name.charAt(0)}
                    </span>
                  )}
                </div>
                {product.brandName ? (
                  <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">
                    {product.brandName}
                  </p>
                ) : null}
                <Link
                  href={`/produkt/${product.slug}`}
                  className="mt-0.5 block font-medium leading-snug hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  {product.name}
                </Link>
                {removeLinks?.[product.id] ? (
                  <Link
                    href={removeLinks[product.id]!}
                    className="mt-1 inline-block text-xs text-neutral-400 hover:text-red-600"
                  >
                    ✕ {t("remove")}
                  </Link>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-neutral-200 bg-emerald-50/40 dark:border-neutral-800 dark:bg-emerald-950/20">
            <th className="px-4 py-3 text-left font-medium">{t("price")}</th>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-3">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {product.minPrice
                    ? tCommon("fromPrice", { price: formatPrice(product.minPrice, currency) })
                    : tCommon("noOffers")}
                </p>
                <p className="text-xs text-neutral-500">
                  {tCommon("offersCount", { count: product.offerCount })}
                </p>
              </td>
            ))}
          </tr>
          {rows.map((row) => (
            <tr
              key={row.name}
              className={`border-b border-neutral-200 last:border-0 dark:border-neutral-800 ${
                row.identical ? "" : "bg-amber-50/50 dark:bg-amber-950/20"
              }`}
            >
              <th className="px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-300">
                {row.name}
              </th>
              {row.values.map((value, index) => (
                <td
                  key={products[index]!.id}
                  className={`px-4 py-2.5 ${
                    row.identical ? "text-neutral-500" : "font-medium"
                  }`}
                >
                  {value ?? <span className="text-neutral-300 dark:text-neutral-600">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
