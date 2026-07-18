import type { MetadataRoute } from "next";
import { isNotNull } from "drizzle-orm";
import { schema } from "@app0/db";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const db = getDb();

  const [products, categories, shops] = await Promise.all([
    db
      .select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt })
      .from(schema.products),
    db
      .select({ slug: schema.categories.slug })
      .from(schema.categories)
      .where(isNotNull(schema.categories.parentId)),
    db.select({ slug: schema.shops.slug }).from(schema.shops),
  ]);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/podmienky`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/sukromie`, changeFrequency: "yearly", priority: 0.2 },
    ...categories.map((category) => ({
      url: `${base}/kategoria/${category.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${base}/produkt/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...shops.map((shop) => ({
      url: `${base}/obchod/${shop.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
