import { schema, type Db } from "@app0/db";
import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

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
  min: number;
  avg: number;
}

/** Denné agregáty cien produktu (EUR) za zvolené obdobie. */
export async function getDailyPrices(db: Db, productId: number, days: number): Promise<PricePoint[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(${schema.productPriceDaily.day}, 'YYYY-MM-DD')`,
      min: schema.productPriceDaily.minPrice,
      avg: schema.productPriceDaily.avgPrice,
    })
    .from(schema.productPriceDaily)
    .where(
      and(
        eq(schema.productPriceDaily.productId, productId),
        eq(schema.productPriceDaily.currency, "EUR"),
        sql`${schema.productPriceDaily.day} > current_date - ${days}::int`,
      ),
    )
    .orderBy(asc(schema.productPriceDaily.day));
  return rows.map((row) => ({ day: row.day, min: Number(row.min), avg: Number(row.avg) }));
}

export interface FairPriceInfo {
  /** Priemer denných miním za posledných 30 dní ("bežná cena") */
  fairPrice: number;
  /** Počet dní s dátami — pod 5 sa bežná cena nezobrazuje */
  days: number;
}

export async function getFairPriceInfo(db: Db, productId: number): Promise<FairPriceInfo | null> {
  const [row] = await db
    .select({
      fairPrice: sql<string | null>`round(avg(${schema.productPriceDaily.minPrice}), 2)`,
      days: count(),
    })
    .from(schema.productPriceDaily)
    .where(
      and(
        eq(schema.productPriceDaily.productId, productId),
        eq(schema.productPriceDaily.currency, "EUR"),
        sql`${schema.productPriceDaily.day} > current_date - 30`,
      ),
    );
  if (!row || row.days < 5 || row.fairPrice === null) return null;
  return { fairPrice: Number(row.fairPrice), days: row.days };
}

export interface PriceDrop {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  brandName: string | null;
  currentPrice: number;
  fairPrice: number;
  dropPct: number;
  offerCount: number;
}

/**
 * Produkty s aktuálnou najnižšou cenou výrazne pod 30-dňovým priemerom.
 * Vyžaduje aspoň 5 dní dát — chráni pred "zľavami" z jednodňovej histórie.
 */
export async function getTopPriceDrops(db: Db, limit = 4): Promise<PriceDrop[]> {
  const rows = await db.execute(sql`
    select p.id, p.name, p.slug, p.image_url, b.name as brand_name,
           cur.min_price as current_price, cur.offer_count,
           agg.avg30 as fair_price,
           round((1 - cur.min_price / agg.avg30) * 100, 1) as drop_pct
    from products p
    left join brands b on b.id = p.brand_id
    join lateral (
      select min(o.price) as min_price, count(*) as offer_count
      from offers o
      where o.product_id = p.id and o.active and o.currency = 'EUR'
    ) cur on cur.min_price is not null
    join lateral (
      select round(avg(d.min_price), 2) as avg30, count(*) as days
      from product_price_daily d
      where d.product_id = p.id and d.currency = 'EUR' and d.day > current_date - 30
    ) agg on agg.days >= 5 and agg.avg30 > 0
    where cur.min_price < agg.avg30 * 0.98
    order by drop_pct desc
    limit ${limit}
  `);
  return (rows as unknown as Record<string, unknown>[]).map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    imageUrl: (row.image_url as string | null) ?? null,
    brandName: (row.brand_name as string | null) ?? null,
    currentPrice: Number(row.current_price),
    fairPrice: Number(row.fair_price),
    dropPct: Number(row.drop_pct),
    offerCount: Number(row.offer_count),
  }));
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

export async function getShopWithFeeds(db: Db, id: number) {
  return db.query.shops.findFirst({
    where: eq(schema.shops.id, id),
    with: { feeds: true },
  });
}

export async function getImportJobs(db: Db, limit = 10) {
  return db
    .select({
      job: schema.importJobs,
      feedUrl: schema.feeds.url,
      shopName: schema.shops.name,
    })
    .from(schema.importJobs)
    .leftJoin(schema.feeds, eq(schema.importJobs.feedId, schema.feeds.id))
    .leftJoin(schema.shops, eq(schema.feeds.shopId, schema.shops.id))
    .orderBy(desc(schema.importJobs.requestedAt))
    .limit(limit);
}

export async function hasActiveImportJobs(db: Db): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.importJobs)
    .where(inArray(schema.importJobs.status, ["pending", "running"]));
  return row!.value > 0;
}
