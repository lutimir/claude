import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { getDb } from "@/lib/db";
import { searchProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = Number(process.env.CATALOG_PAGE_SIZE ?? 24);

interface SearchPageProps {
  searchParams: Promise<{ q?: string; strana?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  // Interné výsledky vyhľadávania do indexu nepatria
  return { title: t("title"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const t = await getTranslations("search");
  const { q, strana } = await searchParams;
  const query = q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(strana ?? "1", 10) || 1);

  if (query.length < 2) {
    return <p className="py-12 text-center text-neutral-500">{t("empty")}</p>;
  }

  const resultsPlusOne = await searchProducts(
    getDb(),
    query,
    PAGE_SIZE + 1,
    (page - 1) * PAGE_SIZE,
  );
  const hasNext = resultsPlusOne.length > PAGE_SIZE;
  const results = resultsPlusOne.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t("resultsFor", { query })}</h1>
      {results.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{t("noResults")}</p>
      ) : (
        <ProductGrid products={results} />
      )}
      <Pagination
        page={page}
        hasNext={hasNext}
        hrefForPage={(target) =>
          `/hladat?q=${encodeURIComponent(query)}${target === 1 ? "" : `&strana=${target}`}`
        }
      />
    </div>
  );
}
