import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mergeComparisonParams } from "@app0/core";
import { ComparisonTable } from "@/components/ComparisonTable";
import { getDb } from "@/lib/db";
import { getParamAliasMap, getProductsForComparison } from "@/lib/queries";

export const dynamic = "force-dynamic";

const MAX_COMPARE = 4;

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("compare");
  return { title: t("title") };
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const t = await getTranslations("compare");
  const { ids: rawIds } = await searchParams;

  const ids = [
    ...new Set(
      (rawIds ?? "")
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ].slice(0, MAX_COMPARE);

  const db = getDb();
  const products = await getProductsForComparison(db, ids);

  if (products.length < 2) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="max-w-md text-neutral-500">{t("needTwo")}</p>
        <Link
          href="/"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("browse")}
        </Link>
      </div>
    );
  }

  const aliasMap = await getParamAliasMap(db);
  const rows = mergeComparisonParams(products, aliasMap);

  const removeLinks = Object.fromEntries(
    products.map((product) => [
      product.id,
      `/porovnat?ids=${products
        .filter((other) => other.id !== product.id)
        .map((other) => other.id)
        .join(",")}`,
    ]),
  );

  // SEO kanonická podoba pre dvojicu
  const canonicalPair =
    products.length === 2 ? `/porovnat/${products[0]!.slug}-vs-${products[1]!.slug}` : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        {canonicalPair ? (
          <Link
            href={canonicalPair}
            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {t("permalink")}
          </Link>
        ) : null}
      </div>
      <ComparisonTable products={products} rows={rows} removeLinks={removeLinks} />
      <p className="text-xs text-neutral-500">{t("diffHint")}</p>
    </div>
  );
}
