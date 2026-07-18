import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertForm } from "@/components/AlertForm";
import { InteractivePriceChart } from "@/components/InteractivePriceChart";
import { OffersTable } from "@/components/OffersTable";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import {
  getCompareSuggestionsCached,
  getDailyPricesCached,
  getFairPriceInfoCached,
  getShopRatingsCached,
} from "@/lib/cachedQueries";
import { currencyForLocale } from "@/lib/currency";
import { getProductBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CHART_RANGES = [30, 90, 365] as const;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ alarm?: string; obdobie?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(getDb(), slug);
  if (!product) return { title: "Produkt" };
  const description = product.description ?? undefined;
  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/produkt/${product.slug}`,
      languages: { sk: `/produkt/${product.slug}`, cs: `/cs/produkt/${product.slug}` },
    },
    openGraph: {
      title: product.name,
      description,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const t = await getTranslations("product");
  const tCompare = await getTranslations("compare");
  const { slug } = await params;
  const { alarm, obdobie } = await searchParams;

  const db = getDb();
  const product = await getProductBySlug(db, slug);
  if (!product) notFound();

  const range = (CHART_RANGES as readonly number[]).includes(Number(obdobie))
    ? Number(obdobie)
    : 90;
  const currency = currencyForLocale(await getLocale());
  const [history, fairPrice, compareSuggestions, shopRatings] = await Promise.all([
    getDailyPricesCached(product.id, range, currency),
    getFairPriceInfoCached(product.id, currency),
    getCompareSuggestionsCached(product.id, product.categoryId),
    getShopRatingsCached([...new Set(product.offers.map((offer) => offer.shopId))].sort()),
  ]);
  const primaryPrices = product.offers
    .filter((offer) => offer.currency === currency)
    .map((offer) => Number(offer.price));
  const currentMin = primaryPrices.length > 0 ? Math.min(...primaryPrices) : null;
  const fairDiffPct =
    fairPrice && currentMin !== null
      ? Math.round((1 - currentMin / fairPrice.fairPrice) * 1000) / 10
      : null;
  const paramEntries = Object.entries(product.params);

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const structuredData: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      ...(product.description ? { description: product.description } : {}),
      ...(product.imageUrl ? { image: product.imageUrl } : {}),
      ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
      ...(product.ean ? { gtin13: product.ean } : {}),
      ...(primaryPrices.length > 0
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: currency,
              lowPrice: Math.min(...primaryPrices).toFixed(2),
              highPrice: Math.max(...primaryPrices).toFixed(2),
              offerCount: primaryPrices.length,
              availability: "https://schema.org/InStock",
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Domov", item: baseUrl },
        ...(product.category
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: product.category.name,
                item: `${baseUrl}/kategoria/${product.category.slug}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: product.category ? 3 : 2,
          name: product.name,
          item: `${baseUrl}/produkt/${product.slug}`,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {structuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-900 dark:hover:text-neutral-100">
          {product.category?.name ? (
            <span>
              {product.category.name}
              {" / "}
            </span>
          ) : null}
        </Link>
        <span className="text-neutral-900 dark:text-neutral-100">{product.name}</span>
      </nav>

      <section className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-56 w-full items-center justify-center rounded-xl bg-white p-4 md:w-72 dark:bg-neutral-900">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-6xl font-bold text-neutral-200 dark:text-neutral-700">
              {product.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          {product.brand ? (
            <p className="text-sm uppercase tracking-wide text-neutral-500">{product.brand.name}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
          {product.description ? (
            <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-300">
              {product.description}
            </p>
          ) : null}
          {product.ean ? (
            <p className="mt-3 text-xs text-neutral-400">
              {t("ean")}: {product.ean}
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("offersTitle")}</h2>
        {product.offers.length === 0 ? (
          <p className="text-neutral-500">{t("noOffers")}</p>
        ) : (
          <OffersTable offers={product.offers} shopRatings={shopRatings} />
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{t("historyTitle")}</h2>
            <nav className="flex gap-1 rounded-lg bg-neutral-100 p-0.5 text-xs dark:bg-neutral-800">
              {CHART_RANGES.map((rangeOption) => (
                <Link
                  key={rangeOption}
                  href={`/produkt/${product.slug}?obdobie=${rangeOption}`}
                  className={`rounded-md px-2.5 py-1 transition ${
                    rangeOption === range
                      ? "bg-white font-medium shadow-sm dark:bg-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  {t(`range${rangeOption}`)}
                </Link>
              ))}
            </nav>
          </div>
          {fairPrice && currentMin !== null && fairDiffPct !== null ? (
            <p className="mb-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-800/60">
              {t("fairPrice")}: <span className="font-semibold">{formatPrice(fairPrice.fairPrice, currency)}</span>
              {" · "}
              {fairDiffPct > 1 ? (
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {t("belowFair", { pct: fairDiffPct.toLocaleString("sk-SK") })}
                </span>
              ) : fairDiffPct < -1 ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {t("aboveFair", { pct: Math.abs(fairDiffPct).toLocaleString("sk-SK") })}
                </span>
              ) : (
                <span className="text-neutral-500">{t("atFair")}</span>
              )}
            </p>
          ) : null}
          <InteractivePriceChart
            points={history}
            emptyLabel={t("historyEmpty")}
            minLabel={t("chartMin")}
            avgLabel={t("chartAvg")}
            currency={currency}
          />
        </div>
        <AlertForm productId={product.id} slug={product.slug} status={alarm} currency={currency} />
      </section>

      {compareSuggestions.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{tCompare("vsSuggestions")}</h2>
          <div className="flex flex-wrap gap-2">
            {compareSuggestions.map((suggestion) => (
              <Link
                key={suggestion.id}
                href={`/porovnat/${product.slug}-vs-${suggestion.slug}`}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm transition hover:border-emerald-500/50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-emerald-400"
              >
                vs {suggestion.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {paramEntries.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("params")}</h2>
          <dl className="grid gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 dark:border-neutral-800 dark:bg-neutral-800">
            {paramEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 bg-white px-4 py-2.5 text-sm dark:bg-neutral-900">
                <dt className="text-neutral-500">{key}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}
