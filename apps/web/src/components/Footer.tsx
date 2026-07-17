import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { appName } from "@/lib/config";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t border-neutral-200 bg-white py-6 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
        <p className="max-w-md">{t("legalNote")}</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/podmienky" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            {t("terms")}
          </Link>
          <Link href="/sukromie" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            {t("privacy")}
          </Link>
          <Link href="/admin" className="hover:text-neutral-900 dark:hover:text-neutral-100">
            {t("admin")}
          </Link>
        </nav>
        <p>
          © {new Date().getFullYear()} {appName()}
        </p>
      </div>
    </footer>
  );
}
