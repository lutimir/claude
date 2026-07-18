import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { appName } from "@/lib/config";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SearchBox } from "./SearchBox";

export async function Header() {
  const t = await getTranslations("common");
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-emerald-600 dark:text-emerald-400">{appName()}</span>
        </Link>
        <div className="min-w-56 flex-1">
          <SearchBox placeholder={t("searchPlaceholder")} buttonLabel={t("search")} />
        </div>
        <Suspense fallback={null}>
          <LocaleSwitcher />
        </Suspense>
      </div>
    </header>
  );
}
