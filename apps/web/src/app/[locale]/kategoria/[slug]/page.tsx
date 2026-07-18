import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Pagination } from "@/components/Pagination";
import { ProductGrid } from "@/components/ProductGrid";
import { getProductsInCategoryCached } from "@/lib/cachedQueries";
import { currencyForLocale } from "@/lib/currency";
import { getDb } from "@/lib/db";
import { getCategoryBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PAGE_SIZE = Number(process.env.CATALOG_PAGE_SIZE ?? 24);

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ strana?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(getDb(), slug);
  return {
    title: category?.name ?? "Kategória",
    alternates: { canonical: `/kategoria/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const t = await getTranslations("category");
  const { slug } = await params;
  const { strana } = await searchParams;

  const page = Math.max(1, Number.parseInt(strana ?? "1", 10) || 1);
  const category = await getCategoryBySlug(getDb(), slug);
  if (!category) notFound();

  // limit+1: posledný záznam len signalizuje existenciu ďalšej strany
  const currency = currencyForLocale(await getLocale());
  const productsPlusOne = await getProductsInCategoryCached(
    category.id,
    PAGE_SIZE + 1,
    (page - 1) * PAGE_SIZE,
    currency,
  );
  const hasNext = productsPlusOne.length > PAGE_SIZE;
  const products = productsPlusOne.slice(0, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      {products.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{t("empty")}</p>
      ) : (
        <ProductGrid products={products} />
      )}
      <Pagination
        page={page}
        hasNext={hasNext}
        hrefForPage={(target) =>
          target === 1 ? `/kategoria/${slug}` : `/kategoria/${slug}?strana=${target}`
        }
      />
    </div>
  );
}
