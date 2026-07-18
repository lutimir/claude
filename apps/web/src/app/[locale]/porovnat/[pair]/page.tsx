import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { mergeComparisonParams } from "@app0/core";
import { ComparisonTable } from "@/components/ComparisonTable";
import { currencyForLocale } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getParamAliasMap, getProductSlugs, getProductsForComparison } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface PairComparePageProps {
  params: Promise<{ pair: string }>;
}

/** SEO stránka "A vs B" — /porovnat/slug-a-vs-slug-b */
async function resolvePair(pair: string) {
  const slugs = decodeURIComponent(pair).split("-vs-");
  if (slugs.length !== 2 || slugs.some((slug) => !/^[a-z0-9-]+$/.test(slug))) return null;

  const db = getDb();
  const found = await getProductSlugs(db, slugs);
  if (found.length !== 2) return null;

  const ids = slugs.map((slug) => found.find((product) => product.slug === slug)!.id);
  const products = await getProductsForComparison(db, ids, currencyForLocale(await getLocale()));
  return products.length === 2 ? products : null;
}

export async function generateMetadata({ params }: PairComparePageProps): Promise<Metadata> {
  const { pair } = await params;
  const products = await resolvePair(pair);
  if (!products) return { title: "Porovnanie" };
  const t = await getTranslations("compare");
  const [first, second] = products;
  return {
    title: `${first!.name} vs ${second!.name}`,
    description: t("seoDescription", {
      first: first!.name,
      second: second!.name,
      firstPrice: first!.minPrice ? formatPrice(first!.minPrice) : "—",
      secondPrice: second!.minPrice ? formatPrice(second!.minPrice) : "—",
    }),
    alternates: { canonical: `/porovnat/${first!.slug}-vs-${second!.slug}` },
  };
}

export default async function PairComparePage({ params }: PairComparePageProps) {
  const t = await getTranslations("compare");
  const { pair } = await params;
  const products = await resolvePair(pair);
  if (!products) notFound();

  const aliasMap = await getParamAliasMap(getDb());
  const rows = mergeComparisonParams(products, aliasMap);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {products[0]!.name} <span className="text-neutral-400">vs</span> {products[1]!.name}
      </h1>
      <ComparisonTable products={products} rows={rows} />
      <p className="text-xs text-neutral-500">{t("diffHint")}</p>
    </div>
  );
}
