/** Odstráni diakritiku: "Slúchadlá" → "Sluchadla" */
export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** URL slug: "Mobilné telefóny" → "mobilne-telefony" */
export function slugify(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Zjednotí biele znaky — základ pre fuzzy porovnávanie názvov (fáza 4). */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
