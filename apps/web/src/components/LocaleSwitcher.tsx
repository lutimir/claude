"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<string, string> = { sk: "SK", cs: "CZ" };

/** Prepínač jazyka/trhu — zachováva aktuálnu cestu. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-lg border border-neutral-200 p-0.5 text-xs dark:border-neutral-700">
      {routing.locales.map((target) => (
        <Link
          key={target}
          href={pathname}
          locale={target}
          className={`rounded-md px-2 py-1 font-medium transition ${
            target === locale
              ? "bg-emerald-600 text-white"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          }`}
        >
          {labels[target]}
        </Link>
      ))}
    </nav>
  );
}
