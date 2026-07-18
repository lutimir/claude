import type { AppLocale } from "@/i18n/routing";

export type Currency = "EUR" | "CZK";

/** Primárna mena trhu: slovenská verzia EUR, česká CZK. */
export function currencyForLocale(locale: string): Currency {
  return (locale as AppLocale) === "cs" ? "CZK" : "EUR";
}
