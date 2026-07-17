import { XMLParser } from "fast-xml-parser";
import type { FeedItem, ParsedFeed } from "./types";

/**
 * Parser Heureka XML formátu — de-facto štandard produktových feedov na SK/CZ
 * trhu (rovnaký formát exportujú obchody pre Heureku aj iné porovnávače).
 * Špecifikácia: https://sluzby.heureka.sk/napoveda/xml-feed/
 */

const parser = new XMLParser({
  ignoreAttributes: true,
  // Hodnoty nechávame ako stringy — EAN a ITEM_ID sa nesmú konvertovať na čísla
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "SHOPITEM" || name === "PARAM",
});

interface RawParam {
  PARAM_NAME?: string;
  VAL?: string;
}

interface RawShopItem {
  ITEM_ID?: string;
  PRODUCTNAME?: string;
  PRODUCT?: string;
  DESCRIPTION?: string;
  URL?: string;
  IMGURL?: string;
  PRICE_VAT?: string;
  MANUFACTURER?: string;
  CATEGORYTEXT?: string;
  EAN?: string;
  DELIVERY_DATE?: string;
  PARAM?: RawParam[];
}

/** "1 299,90 EUR" → 1299.9; nevalidná hodnota → null */
export function parseFeedPrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/** "Elektronika | Mobilné telefóny" → ["Elektronika", "Mobilné telefóny"] */
export function parseCategoryPath(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[|>]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function parseHeurekaFeed(xml: string): ParsedFeed {
  let doc: { SHOP?: { SHOPITEM?: RawShopItem[] } };
  try {
    doc = parser.parse(xml);
  } catch (err) {
    throw new Error(`Feed sa nepodarilo naparsovať ako XML: ${String(err)}`);
  }

  const shop = doc.SHOP;
  if (!shop) {
    throw new Error("Neplatný Heureka feed: chýba koreňový element <SHOP>");
  }

  const items: FeedItem[] = [];
  const warnings: string[] = [];

  for (const [index, raw] of (shop.SHOPITEM ?? []).entries()) {
    const externalId = raw.ITEM_ID?.trim();
    const name = (raw.PRODUCTNAME ?? raw.PRODUCT)?.trim();
    const url = raw.URL?.trim();
    const price = parseFeedPrice(raw.PRICE_VAT);

    if (!externalId || !name || !url || price === null) {
      warnings.push(
        `Položka #${index + 1} preskočená (ITEM_ID=${externalId ?? "?"}): ` +
          "chýba ITEM_ID, PRODUCTNAME, URL alebo platná PRICE_VAT",
      );
      continue;
    }

    const params: Record<string, string> = {};
    for (const param of raw.PARAM ?? []) {
      const key = param.PARAM_NAME?.trim();
      const value = param.VAL?.trim();
      if (key && value) params[key] = value;
    }

    items.push({
      externalId,
      name,
      description: raw.DESCRIPTION?.trim() || undefined,
      url,
      imageUrl: raw.IMGURL?.trim() || undefined,
      price,
      manufacturer: raw.MANUFACTURER?.trim() || undefined,
      categoryPath: parseCategoryPath(raw.CATEGORYTEXT),
      ean: raw.EAN?.trim() || undefined,
      params,
      availability: raw.DELIVERY_DATE?.trim() || undefined,
    });
  }

  return { items, warnings };
}
