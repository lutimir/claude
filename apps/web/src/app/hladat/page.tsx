import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/ProductGrid";
import { getDb } from "@/lib/db";
import { searchProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations("search");
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (query.length < 2) {
    return <p className="py-12 text-center text-neutral-500">{t("empty")}</p>;
  }

  const results = await searchProducts(getDb(), query);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("resultsFor", { query })}</h1>
      {results.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{t("noResults")}</p>
      ) : (
        <ProductGrid products={results} />
      )}
    </div>
  );
}
