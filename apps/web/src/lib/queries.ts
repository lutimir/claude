import { schema, type Db } from "@app0/db";
import { and, asc, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

export interface ProductCardData {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  brandName: string | null;
  /** Najnižšia aktívna cena v EUR; CZK agregácie rieši fáza 8 */
  minPrice: string | null;
  offerCount: number;
}

const productCardSelect = {
  id: schema.products.id,
  name: schema.products.name,
  slug: schema.products.slug,
  imageUrl: schema.products.imageUrl,
  brandName: schema.brands.name,
  minPrice: sql<
    string | null
  >`min(${schema.offers.price}) filter (where ${schema.offers.active} and ${schema.offers.currency} = 'EUR')`,
  offerCount: sql<number>`count(${schema.offers.id}) filter (where ${schema.offers.active})`.mapWith(
    Number,
  ),
};

export async function getStats(db: Db) {
  const [products] = await db.select({ value: count() }).from(schema.products);
  const [offers] = await db
    .select({ value: count() })
    .from(schema.offers)
    .where(eq(schema.offers.active, true));
  const [shops] = await db
    .select({ value: count() })
    .from(schema.shops)
    .where(eq(schema.shops.status, "active"));
  return { products: products!.value, offers: offers!.value, shops: shops!.value };
}

export async function getLatestProducts(db: Db, limit = 8): Promise<ProductCardData[]> {
  return db
    .select(productCardSelect)
    .from(schema.products)
    .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
    .leftJoin(schema.offers, eq(schema.offers.productId, schema.products.id))
    .groupBy(schema.products.id, schema.brands.name)
    .orderBy(desc(schema.products.createdAt))
    .limit(limit);
}

/**
 * Full-text vyhľadávanie (bez diakritiky cez immutable_unaccent) s ILIKE
 * fallbackom na čiastočné zhody a presnou zhodou na EAN.
 */
export async function searchProducts(db: Db, query: string, limit = 24): Promise<ProductCardData[]> {
  const pattern = `%${query}%`;
  return db
    .select(productCardSelect)
    .from(schema.products)
    .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
    .leftJoin(schema.offers, eq(schema.offers.productId, schema.products.id))
    .where(
      sql`(
        to_tsvector('simple', immutable_unaccent(${schema.products.name}))
          @@ websearch_to_tsquery('simple', immutable_unaccent(${query}))
        or immutable_unaccent(${schema.products.name}) ilike immutable_unaccent(${pattern})
        or ${schema.products.ean} = ${query}
      )`,
    )
    .groupBy(schema.products.id, schema.brands.name)
    .orderBy(
      sql`ts_rank(
        to_tsvector('simple', immutable_unaccent(${schema.products.name})),
        websearch_to_tsquery('simple', immutable_unaccent(${query}))
      ) desc`,
      desc(schema.products.createdAt),
    )
    .limit(limit);
}

export async function getCategoriesWithCounts(db: Db) {
  return db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      slug: schema.categories.slug,
      productCount: count(schema.products.id),
    })
    .from(schema.categories)
    .leftJoin(schema.products, eq(schema.products.categoryId, schema.categories.id))
    .where(isNotNull(schema.categories.parentId))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.name));
}

export async function getCategoryBySlug(db: Db, slug: string) {
  return db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) });
}

export async function getProductsInCategory(
  db: Db,
  categoryId: number,
  limit = 48,
): Promise<ProductCardData[]> {
  return db
    .select(productCardSelect)
    .from(schema.products)
    .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
    .leftJoin(schema.offers, eq(schema.offers.productId, schema.products.id))
    .where(eq(schema.products.categoryId, categoryId))
    .groupBy(schema.products.id, schema.brands.name)
    .orderBy(asc(schema.products.name))
    .limit(limit);
}

export async function getProductBySlug(db: Db, slug: string) {
  return db.query.products.findFirst({
    where: eq(schema.products.slug, slug),
    with: {
      brand: true,
      category: true,
      offers: {
        where: eq(schema.offers.active, true),
        orderBy: [asc(schema.offers.price)],
        with: { shop: true },
      },
    },
  });
}

export interface PricePoint {
  day: string;
  price: number;
}

/** Denné minimum ceny naprieč všetkými ponukami produktu (EUR, 90 dní). */
export async function getDailyPriceHistory(db: Db, productId: number): Promise<PricePoint[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${schema.priceHistory.recordedAt}), 'YYYY-MM-DD')`,
      price: sql<string>`min(${schema.priceHistory.price})`,
    })
    .from(schema.priceHistory)
    .innerJoin(schema.offers, eq(schema.priceHistory.offerId, schema.offers.id))
    .where(
      and(
        eq(schema.offers.productId, productId),
        eq(schema.priceHistory.currency, "EUR"),
        sql`${schema.priceHistory.recordedAt} > now() - interval '90 days'`,
      ),
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return rows.map((row) => ({ day: row.day, price: Number(row.price) }));
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getAdminStats(db: Db) {
  const base = await getStats(db);
  const [unmatched] = await db
    .select({ value: count() })
    .from(schema.offers)
    .where(and(eq(schema.offers.active, true), isNull(schema.offers.productId)));
  const [alerts] = await db.select({ value: count() }).from(schema.priceAlerts);
  return { ...base, unmatched: unmatched!.value, alerts: alerts!.value };
}

export async function getFeedRunsWithShops(db: Db, limit = 50) {
  return db
    .select({
      run: schema.feedRuns,
      feedUrl: schema.feeds.url,
      shopName: schema.shops.name,
    })
    .from(schema.feedRuns)
    .innerJoin(schema.feeds, eq(schema.feedRuns.feedId, schema.feeds.id))
    .innerJoin(schema.shops, eq(schema.feeds.shopId, schema.shops.id))
    .orderBy(desc(schema.feedRuns.startedAt))
    .limit(limit);
}

export async function getShopsWithFeeds(db: Db) {
  return db.query.shops.findMany({
    with: { feeds: true },
    orderBy: [asc(schema.shops.name)],
  });
}
