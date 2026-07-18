"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const COMPARE_PARAM = "porovnat";
export const MAX_COMPARE = 4;

export function parseCompareIds(raw: string | null): number[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

interface CompareToggleProps {
  productId: number;
  label: string;
  activeLabel: string;
}

/** Prepínač výberu produktu na porovnanie — stav žije v URL (?porovnat=1,2). */
export function CompareToggle({ productId, label, activeLabel }: CompareToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ids = parseCompareIds(searchParams.get(COMPARE_PARAM));
  const selected = ids.includes(productId);

  function toggle(event: React.MouseEvent) {
    // karta je celá <Link> — klik na prepínač nesmie navigovať
    event.preventDefault();
    event.stopPropagation();
    const next = selected
      ? ids.filter((id) => id !== productId)
      : [...ids, productId].slice(0, MAX_COMPARE);
    const params = new URLSearchParams(searchParams);
    if (next.length > 0) params.set(COMPARE_PARAM, next.join(","));
    else params.delete(COMPARE_PARAM);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={selected}
      title={selected ? activeLabel : label}
      className={`absolute right-2 top-2 z-10 rounded-full px-2 py-1 text-xs font-medium shadow-sm transition ${
        selected
          ? "bg-emerald-600 text-white"
          : "bg-white/90 text-neutral-600 hover:text-emerald-700 dark:bg-neutral-800/90 dark:text-neutral-300"
      }`}
    >
      ⇄ {selected ? activeLabel : label}
    </button>
  );
}
