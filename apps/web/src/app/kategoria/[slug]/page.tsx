import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/ProductGrid";
import { getDb } from "@/lib/db";
import { getCategoryBySlug, getProductsInCategory } from "@/lib/queries";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(getDb(), slug);
  return { title: category?.name ?? "Kategória" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const t = await getTranslations("category");
  const { slug } = await params;

  const db = getDb();
  const category = await getCategoryBySlug(db, slug);
  if (!category) notFound();

  const products = await getProductsInCategory(db, category.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{category.name}</h1>
      {products.length === 0 ? (
        <p className="py-12 text-center text-neutral-500">{t("empty")}</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
