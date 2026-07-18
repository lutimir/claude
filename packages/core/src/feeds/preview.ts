import { normalizeEan } from "../matching/ean";
import type { ParsedFeed } from "./types";

/** Náhľad feedu pre admin validátor — vzniká pred uložením feedu do DB. */
export interface FeedPreviewItem {
  externalId: string;
  name: string;
  price: number;
  ean?: string;
  eanValid: boolean;
  category?: string;
}

export interface FeedPreview {
  totalItems: number;
  itemsWithValidEan: number;
  itemsWithInvalidEan: number;
  itemsWithoutEan: number;
  warningsCount: number;
  /** Prvých pár varovaní na zobrazenie */
  warnings: string[];
  /** Ukážka prvých položiek */
  sample: FeedPreviewItem[];
}

const MAX_SAMPLE = 8;
const MAX_WARNINGS = 5;

export function buildFeedPreview(parsed: ParsedFeed): FeedPreview {
  let itemsWithValidEan = 0;
  let itemsWithInvalidEan = 0;
  let itemsWithoutEan = 0;

  for (const item of parsed.items) {
    if (!item.ean) {
      itemsWithoutEan++;
    } else if (normalizeEan(item.ean)) {
      itemsWithValidEan++;
    } else {
      itemsWithInvalidEan++;
    }
  }

  return {
    totalItems: parsed.items.length,
    itemsWithValidEan,
    itemsWithInvalidEan,
    itemsWithoutEan,
    warningsCount: parsed.warnings.length,
    warnings: parsed.warnings.slice(0, MAX_WARNINGS),
    sample: parsed.items.slice(0, MAX_SAMPLE).map((item) => ({
      externalId: item.externalId,
      name: item.name,
      price: item.price,
      ean: item.ean,
      eanValid: item.ean ? normalizeEan(item.ean) !== null : false,
      category: item.categoryPath[item.categoryPath.length - 1],
    })),
  };
}
