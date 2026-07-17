/**
 * Validácia a normalizácia EAN/GTIN kódov (GTIN-8, GTIN-12, GTIN-13, GTIN-14).
 * EAN je primárny kľúč na párovanie toho istého produktu naprieč obchodmi.
 */

/** Kontrolná číslica (mod-10) pre telo kódu bez poslednej číslice. */
export function eanCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const digit = body.charCodeAt(body.length - 1 - i) - 48;
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidEan(value: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(value)) return false;
  const body = value.slice(0, -1);
  const check = value.charCodeAt(value.length - 1) - 48;
  return eanCheckDigit(body) === check;
}

/**
 * Očistí surovú hodnotu z feedu (medzery, pomlčky) a vráti platný EAN,
 * alebo null, ak hodnota nie je platný kód — vtedy sa produkt nepáruje
 * automaticky, ale ide do fronty na fuzzy/manuálne párovanie (fáza 4).
 */
export function normalizeEan(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s-]/g, "");
  return isValidEan(cleaned) ? cleaned : null;
}
