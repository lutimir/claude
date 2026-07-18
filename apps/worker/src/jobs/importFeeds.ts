import { fetchFeedXml, normalizeEan, parseHeurekaFeed, slugify, type FeedItem } from "@app0/core";
import { schema, type Db } from "@app0/db";
import { and, eq, lt } from "drizzle-orm";
import { log } from "../lib/log";

type Feed = typeof schema.feeds.$inferSelect;
type Shop = typeof schema.shops.$inferSelect;

interface ImportCounters {
  total: number;
  created: number;
  updated: number;
  unmatched: number;
}

/** Importuje všetky zapnuté feedy aktívnych obchodov s potvrdeným súhlasom. */
export async function importAllFeeds(db: Db): Promise<void> {
  const feedList = await db
    .select({ feed: schema.feeds, shop: schema.shops })
    .from(schema.feeds)
    .innerJoin(schema.shops, eq(schema.feeds.shopId, schema.shops.id))
    .where(and(eq(schema.feeds.enabled, true), eq(schema.shops.status, "active")));

  if (feedList.length === 0) {
    log("Žiadne zapnuté feedy na import.");
    return;
  }

  for (const { feed, shop } of feedList) {
    // Compliance poistka: bez potvrdeného súhlasu obchodu sa feed nesťahuje.
    if (!feed.consentConfirmedAt) {
      log(`Feed #${feed.id} (${shop.name}) preskočený: chýba potvrdený súhlas obchodu.`);
      continue;
    }
    await importFeed(db, feed, shop);
  }
}

/**
 * Import jedného feedu podľa ID (manuálne spustenie z adminu). Consent je
 * povinný vždy; `enabled` sa pri manuálnom spustení ignoruje, aby sa dal
 * feed otestovať ešte pred zapnutím automatických importov.
 */
export async function importFeedById(db: Db, feedId: number): Promise<void> {
  const [row] = await db
    .select({ feed: schema.feeds, shop: schema.shops })
    .from(schema.feeds)
    .innerJoin(schema.shops, eq(schema.feeds.shopId, schema.shops.id))
    .where(eq(schema.feeds.id, feedId));

  if (!row) throw new Error(`Feed #${feedId} neexistuje`);
  if (!row.feed.consentConfirmedAt) {
    throw new Error(`Feed #${feedId} nemá potvrdený súhlas obchodu — import je zablokovaný`);
  }
  await importFeed(db, row.feed, row.shop);
}

export async function importFeed(db: Db, feed: Feed, shop: Shop): Promise<void> {
  log(`Import feedu #${feed.id} — ${shop.name} (${feed.url})`);
  const startedAt = new Date();
  const [run] = await db
    .insert(schema.feedRuns)
    .values({ feedId: feed.id, startedAt })
    .returning();

  const counters: ImportCounters = { total: 0, created: 0, updated: 0, unmatched: 0 };

  try {
    const xml = await fetchFeedXml(feed.url, { contact: process.env.FEED_FETCH_CONTACT });
    const { items, warnings } = parseHeurekaFeed(xml);
    counters.total = items.length;
    for (const warning of warnings) log(`  varovanie: ${warning}`);

    for (const item of items) {
      await upsertOffer(db, feed, shop, item, counters, startedAt);
    }

    // Ponuky, ktoré z feedu zmizli, už obchod nepredáva — deaktivuj ich.
    await db
      .update(schema.offers)
      .set({ active: false })
      .where(
        and(
          eq(schema.offers.feedId, feed.id),
          lt(schema.offers.lastSeenAt, startedAt),
          eq(schema.offers.active, true),
        ),
      );

    await db
      .update(schema.feedRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        offersTotal: counters.total,
        offersCreated: counters.created,
        offersUpdated: counters.updated,
        offersUnmatched: counters.unmatched,
        warningsCount: warnings.length,
      })
      .where(eq(schema.feedRuns.id, run!.id));
    await db.update(schema.feeds).set({ lastRunAt: new Date() }).where(eq(schema.feeds.id, feed.id));

    log(
      `  hotovo: ${counters.total} položiek, ${counters.created} nových, ` +
        `${counters.updated} aktualizovaných, ${counters.unmatched} nespárovaných`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(schema.feedRuns)
      .set({ status: "error", finishedAt: new Date(), errorMessage: message })
      .where(eq(schema.feedRuns.id, run!.id));
    log(`  CHYBA: ${message}`);
  }
}

async function upsertOffer(
  db: Db,
  feed: Feed,
  shop: Shop,
  item: FeedItem,
  counters: ImportCounters,
  seenAt: Date,
): Promise<void> {
  const ean = normalizeEan(item.ean);
  let productId: number | null = null;
  let matchStatus: "matched_ean" | "unmatched" = "unmatched";

  if (ean) {
    productId = await findOrCreateProductByEan(db, ean, item);
    matchStatus = "matched_ean";
  } else {
    counters.unmatched++;
  }

  const priceStr = item.price.toFixed(2);
  const currency = shop.country === "cz" ? ("CZK" as const) : ("EUR" as const);

  const existing = await db.query.offers.findFirst({
    where: and(eq(schema.offers.feedId, feed.id), eq(schema.offers.externalId, item.externalId)),
  });

  if (!existing) {
    const [offer] = await db
      .insert(schema.offers)
      .values({
        productId,
        shopId: shop.id,
        feedId: feed.id,
        externalId: item.externalId,
        title: item.name,
        url: item.url,
        imageUrl: item.imageUrl,
        price: priceStr,
        currency,
        availability: item.availability,
        eanRaw: item.ean,
        matchStatus,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
        priceUpdatedAt: seenAt,
      })
      .returning();
    await db.insert(schema.priceHistory).values({
      offerId: offer!.id,
      price: priceStr,
      currency,
      recordedAt: seenAt,
    });
    counters.created++;
    return;
  }

  const priceChanged = Number(existing.price) !== item.price;
  await db
    .update(schema.offers)
    .set({
      title: item.name,
      url: item.url,
      imageUrl: item.imageUrl,
      price: priceStr,
      availability: item.availability,
      eanRaw: item.ean,
      // Už spárovanú ponuku nechávame tak (manuálne párovanie má prednosť).
      productId: existing.productId ?? productId,
      matchStatus: existing.productId ? existing.matchStatus : matchStatus,
      active: true,
      lastSeenAt: seenAt,
      ...(priceChanged ? { priceUpdatedAt: seenAt } : {}),
    })
    .where(eq(schema.offers.id, existing.id));

  if (priceChanged) {
    await db.insert(schema.priceHistory).values({
      offerId: existing.id,
      price: priceStr,
      currency: existing.currency,
      recordedAt: seenAt,
    });
  }
  counters.updated++;
}

/**
 * Nájde produkt podľa EAN; ak neexistuje, založí ho z dát ponuky
 * (názov, značka, kategória, parametre). EAN je unikátny — súbehy rieši
 * onConflictDoNothing + opätovné vyhľadanie.
 */
async function findOrCreateProductByEan(db: Db, ean: string, item: FeedItem): Promise<number> {
  const found = await db.query.products.findFirst({ where: eq(schema.products.ean, ean) });
  if (found) return found.id;

  const brandId = item.manufacturer ? await findOrCreateBrand(db, item.manufacturer) : null;
  const categoryId =
    item.categoryPath.length > 0 ? await findOrCreateCategory(db, item.categoryPath) : null;

  const baseSlug = slugify(item.name);
  for (const slug of [baseSlug, `${baseSlug}-${ean.slice(-6)}`]) {
    const inserted = await db
      .insert(schema.products)
      .values({
        name: item.name,
        slug,
        brandId,
        categoryId,
        ean,
        description: item.description,
        imageUrl: item.imageUrl,
        params: item.params,
      })
      .onConflictDoNothing()
      .returning({ id: schema.products.id });
    if (inserted.length > 0) return inserted[0]!.id;

    // Konflikt: buď slug patrí inému produktu (skús variant s EAN),
    // alebo produkt s týmto EAN medzičasom vytvoril súbežný beh.
    const raced = await db.query.products.findFirst({ where: eq(schema.products.ean, ean) });
    if (raced) return raced.id;
  }
  throw new Error(`Nepodarilo sa vytvoriť produkt pre EAN ${ean} (${item.name})`);
}

async function findOrCreateBrand(db: Db, name: string): Promise<number | null> {
  const found = await db.query.brands.findFirst({ where: eq(schema.brands.name, name) });
  if (found) return found.id;
  const inserted = await db
    .insert(schema.brands)
    .values({ name, slug: slugify(name) })
    .onConflictDoNothing()
    .returning({ id: schema.brands.id });
  if (inserted.length > 0) return inserted[0]!.id;
  const raced = await db.query.brands.findFirst({ where: eq(schema.brands.name, name) });
  return raced?.id ?? null;
}

/** Kategóriu zakladá z najhlbšieho segmentu cesty; strom rieši fáza 1. */
async function findOrCreateCategory(db: Db, path: string[]): Promise<number | null> {
  const name = path[path.length - 1]!;
  const slug = slugify(name);
  const found = await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) });
  if (found) return found.id;
  const inserted = await db
    .insert(schema.categories)
    .values({ name, slug })
    .onConflictDoNothing()
    .returning({ id: schema.categories.id });
  if (inserted.length > 0) return inserted[0]!.id;
  const raced = await db.query.categories.findFirst({ where: eq(schema.categories.slug, slug) });
  return raced?.id ?? null;
}
