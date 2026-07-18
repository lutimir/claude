import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface PaginationProps {
  page: number;
  hasNext: boolean;
  hrefForPage: (page: number) => string;
}

export async function Pagination({ page, hasNext, hrefForPage }: PaginationProps) {
  const t = await getTranslations("common");
  if (page <= 1 && !hasNext) return null;

  const linkClass =
    "rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm transition hover:border-emerald-500/50 hover:text-emerald-700 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-emerald-400";

  return (
    <nav className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} rel="prev" className={linkClass}>
          ← {t("prevPage")}
        </Link>
      ) : null}
      <span className="text-sm text-neutral-500">{t("pageIndicator", { page })}</span>
      {hasNext ? (
        <Link href={hrefForPage(page + 1)} rel="next" className={linkClass}>
          {t("nextPage")} →
        </Link>
      ) : null}
    </nav>
  );
}
