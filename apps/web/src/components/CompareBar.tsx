"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { COMPARE_PARAM, parseCompareIds } from "./CompareToggle";

interface CompareBarProps {
  ctaLabel: string;
  clearLabel: string;
}

/** Plávajúca lišta s výberom na porovnanie — zobrazí sa pri 2+ produktoch. */
export function CompareBar({ ctaLabel, clearLabel }: CompareBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ids = parseCompareIds(searchParams.get(COMPARE_PARAM));

  if (ids.length < 2 || pathname.startsWith("/porovnat")) return null;

  function clear() {
    const params = new URLSearchParams(searchParams);
    params.delete(COMPARE_PARAM);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-neutral-200 bg-white py-2 pl-4 pr-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <span className="text-sm font-medium">⇄ {ids.length}</span>
        <Link
          href={`/porovnat?ids=${ids.join(",")}`}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {ctaLabel}
        </Link>
        <button
          type="button"
          onClick={clear}
          className="rounded-full px-3 py-1.5 text-sm text-neutral-500 transition hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
