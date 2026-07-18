import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getShopsWithFeeds } from "@/lib/queries";
import { requestImport } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  const t = await getTranslations("admin");
  const shops = await getShopsWithFeeds(getDb());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link
          href="/admin/obchody/novy"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("addShop")}
        </Link>
      </div>

      {shops.map((shop) => (
        <section
          key={shop.id}
          className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {shop.name}
              <span className="ml-2 text-xs font-normal uppercase text-neutral-400">
                {shop.country}
              </span>
              {shop.status === "paused" ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {t("statusPaused")}
                </span>
              ) : null}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <p className="text-neutral-500">
                {t("shopLegalBasis")}:{" "}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {t(`legalBasis_${shop.legalBasis}`)}
                </span>
              </p>
              <Link
                href={`/admin/obchody/${shop.id}`}
                className="text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {t("edit")}
              </Link>
            </div>
          </div>
          <a
            href={shop.websiteUrl}
            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
            target="_blank"
            rel="noopener"
          >
            {shop.websiteUrl}
          </a>

          {shop.feeds.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">
              {t("noFeeds")}
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-950">
                    <th className="px-3 py-2 font-medium">{t("feedUrl")}</th>
                    <th className="px-3 py-2 font-medium">{t("feedEnabled")}</th>
                    <th className="px-3 py-2 font-medium">{t("feedConsent")}</th>
                    <th className="px-3 py-2 font-medium">{t("feedLastRun")}</th>
                    <th className="px-3 py-2 font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shop.feeds.map((feed) => (
                    <tr
                      key={feed.id}
                      className="border-b border-neutral-200 last:border-0 dark:border-neutral-800"
                    >
                      <td className="max-w-96 truncate px-3 py-2 font-mono text-xs">{feed.url}</td>
                      <td className="px-3 py-2">{feed.enabled ? t("yes") : t("no")}</td>
                      <td className="px-3 py-2">
                        {feed.consentConfirmedAt
                          ? formatDateTime(feed.consentConfirmedAt)
                          : t("no")}
                      </td>
                      <td className="px-3 py-2">{formatDateTime(feed.lastRunAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/obchody/${shop.id}/feed/${feed.id}`}
                            className="text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            {t("edit")}
                          </Link>
                          <form action={requestImport}>
                            <input type="hidden" name="feedId" value={feed.id} />
                            <button
                              type="submit"
                              className="rounded-md border border-neutral-300 px-2 py-1 text-xs transition hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-700 dark:hover:text-emerald-400"
                            >
                              {t("importNow")}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
