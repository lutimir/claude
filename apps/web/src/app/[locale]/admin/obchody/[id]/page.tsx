import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShopForm } from "@/components/admin/ShopForm";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getShopWithFeeds } from "@/lib/queries";
import { requestImport, updateShop } from "../actions";

export const dynamic = "force-dynamic";

interface EditShopPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chyba?: string; ulozene?: string }>;
}

export default async function EditShopPage({ params, searchParams }: EditShopPageProps) {
  const t = await getTranslations("admin");
  const { id } = await params;
  const { chyba, ulozene } = await searchParams;

  const shopId = Number(id);
  if (!Number.isInteger(shopId)) notFound();
  const shop = await getShopWithFeeds(getDb(), shopId);
  if (!shop) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/obchody"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          {t("backToShops")}
        </Link>
        <h2 className="mt-1 text-lg font-semibold">
          {t("editShop")}: {shop.name}
        </h2>
      </div>

      <ShopForm shop={shop} action={updateShop} error={chyba} saved={ulozene === "1"} />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("shops")}</h3>
          <Link
            href={`/admin/obchody/${shop.id}/feed/novy`}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {t("addFeed")}
          </Link>
        </div>

        {shop.feeds.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {t("noFeeds")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-900">
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
                    <td className="max-w-80 truncate px-3 py-2 font-mono text-xs">{feed.url}</td>
                    <td className="px-3 py-2">{feed.enabled ? t("yes") : t("no")}</td>
                    <td className="px-3 py-2">
                      {feed.consentConfirmedAt ? formatDateTime(feed.consentConfirmedAt) : t("no")}
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
    </div>
  );
}
