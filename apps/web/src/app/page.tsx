import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/ProductGrid";
import { getDb } from "@/lib/db";
import { getCategoriesWithCounts, getLatestProducts, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const db = getDb();
  const [stats, categories, latestProducts] = await Promise.all([
    getStats(db),
    getCategoriesWithCounts(db),
    getLatestProducts(db),
  ]);

  const statItems = [
    { value: stats.products, label: t("statsProducts") },
    { value: stats.offers, label: t("statsOffers") },
    { value: stats.shops, label: t("statsShops") },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-12 text-white">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{t("heroTitle")}</h1>
        <p className="mt-3 max-w-2xl text-emerald-50">{t("heroSubtitle")}</p>
        <dl className="mt-8 flex flex-wrap gap-8">
          {statItems.map((item) => (
            <div key={item.label}>
              <dt className="text-sm text-emerald-100">{item.label}</dt>
              <dd className="text-2xl font-bold">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("categories")}</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/kategoria/${category.slug}`}
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm transition hover:border-emerald-500/50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-emerald-400"
            >
              {category.name}
              <span className="ml-1.5 text-neutral-400">{category.productCount}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("latestProducts")}</h2>
        <ProductGrid products={latestProducts} />
      </section>
    </div>
  );
}
