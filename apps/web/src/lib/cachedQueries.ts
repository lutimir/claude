import type { Currency } from "./queries";
import { unstable_cache } from "next/cache";
import { getDb } from "./db";
import {
  getCategoriesWithCounts,
  getCompareSuggestions,
  getDailyPrices,
  getFairPriceInfo,
  getLatestProducts,
  getProductsInCategory,
  getShopRatings,
  getStats,
  getTopPriceDrops,
} from "./queries";

/**
 * Cache vrstva pre verejný katalóg: TTL 5 minút + tag, ktorý worker
 * invaliduje po každom importe cez POST /api/revalidate. Stránky ostávajú
 * dynamické (searchParams), ale DB dostáva zlomok dopytov.
 *
 * Pozor: unstable_cache serializuje výsledky do JSON — cachujeme len dotazy
 * bez Date polí (hlavný dotaz produktu s ponukami ostáva live, ceny sú vždy
 * čerstvé).
 */
export const CATALOG_TAG = "catalog";
const TTL_SECONDS = 300;

function cached<Args extends (string | number | number[] | null)[], Result>(
  keyPrefix: string,
  fn: (...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, [keyPrefix], { revalidate: TTL_SECONDS, tags: [CATALOG_TAG] });
}

export const getStatsCached = cached("stats", async () => getStats(getDb()));

export const getCategoriesWithCountsCached = cached("categories", async () =>
  getCategoriesWithCounts(getDb()),
);

export const getLatestProductsCached = cached(
  "latest-products",
  async (limit: number, currency: Currency) => getLatestProducts(getDb(), limit, currency),
);

export const getTopPriceDropsCached = cached("price-drops", async (limit: number, currency: Currency) =>
  getTopPriceDrops(getDb(), limit, currency),
);

export const getProductsInCategoryCached = cached(
  "category-products",
  async (categoryId: number, limit: number, offset: number, currency: Currency) =>
    getProductsInCategory(getDb(), categoryId, limit, offset, currency),
);

export const getDailyPricesCached = cached(
  "daily-prices",
  async (productId: number, days: number, currency: Currency) =>
    getDailyPrices(getDb(), productId, days, currency),
);

export const getFairPriceInfoCached = cached(
  "fair-price",
  async (productId: number, currency: Currency) => getFairPriceInfo(getDb(), productId, currency),
);

export const getCompareSuggestionsCached = cached(
  "compare-suggestions",
  async (productId: number, categoryId: number | null) =>
    getCompareSuggestions(getDb(), productId, categoryId),
);

export const getShopRatingsCached = cached("shop-ratings", async (shopIds: number[]) =>
  getShopRatings(getDb(), shopIds),
);
