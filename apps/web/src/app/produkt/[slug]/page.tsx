import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlertForm } from "@/components/AlertForm";
import { OffersTable } from "@/components/OffersTable";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { getDb } from "@/lib/db";
import { getDailyPriceHistory, getProductBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ alarm?: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(getDb(), slug);
  return { title: product?.name ?? "Produkt" };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const t = await getTranslations("product");
  const { slug } = await params;
  const { alarm } = await searchParams;

  const db = getDb();
  const product = await getProductBySlug(db, slug);
  if (!product) notFound();

  const history = await getDailyPriceHistory(db, product.id);
  const paramEntries = Object.entries(product.params);

  return (
    <div className="flex flex-col gap-8">
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
          <OffersTable offers={product.offers} />
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-3 font-semibold">{t("historyTitle")}</h2>
          <PriceHistoryChart points={history} emptyLabel={t("historyEmpty")} />
        </div>
        <AlertForm productId={product.id} slug={product.slug} status={alarm} />
      </section>

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
