import { stripDiacritics } from "../text/normalize";

/** Normalizácia kľúča parametra na porovnávanie: lower, bez diakritiky. */
export function normalizeParamKey(key: string): string {
  return stripDiacritics(key).toLowerCase().replace(/\s+/g, " ").trim();
}

export interface ComparisonProductParams {
  id: number;
  params: Record<string, string>;
}

export interface ComparisonRow {
  /** Zobrazovaný (kanonický) názov parametra */
  name: string;
  /** Hodnota pre každý produkt v poradí vstupu; null = produkt parameter nemá */
  values: (string | null)[];
  /** true = všetky produkty majú parameter a hodnoty sú zhodné */
  identical: boolean;
}

/**
 * Zlúči parametre produktov do riadkov porovnávacej tabuľky. Kľúče sa
 * normalizujú a mapujú cez číselník aliasov (normalizovaný alias →
 * kanonický názov), takže "Úložisko" a "Pamäť" skončia v jednom riadku.
 * Riadky sa radia podľa počtu produktov, ktoré parameter majú.
 */
export function mergeComparisonParams(
  products: ComparisonProductParams[],
  aliasMap: Map<string, string>,
): ComparisonRow[] {
  interface RowAccumulator {
    name: string;
    values: (string | null)[];
    order: number;
  }
  const rows = new Map<string, RowAccumulator>();
  let insertOrder = 0;

  for (const [index, product] of products.entries()) {
    for (const [rawKey, value] of Object.entries(product.params)) {
      const canonical = aliasMap.get(normalizeParamKey(rawKey)) ?? rawKey;
      const rowKey = normalizeParamKey(canonical);
      let row = rows.get(rowKey);
      if (!row) {
        row = { name: canonical, values: products.map(() => null), order: insertOrder++ };
        rows.set(rowKey, row);
      }
      row.values[index] ??= value;
    }
  }

  return [...rows.values()]
    .sort((a, b) => {
      const filledA = a.values.filter((value) => value !== null).length;
      const filledB = b.values.filter((value) => value !== null).length;
      return filledB - filledA || a.order - b.order;
    })
    .map((row) => ({
      name: row.name,
      values: row.values,
      identical:
        row.values.every((value) => value !== null) &&
        new Set(row.values.map((value) => value!.trim().toLowerCase())).size === 1,
    }));
}
