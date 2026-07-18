import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sk", "cs"],
  defaultLocale: "sk",
  // sk beží bez prefixu (spätne kompatibilné URL), čeština na /cs
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];
