import { getTranslations } from "next-intl/server";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getAdminStats, getClicksByShop, getFeedRunsWithShops } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin");
  const db = getDb();
  const [stats, runs, clickStats] = await Promise.all([
    getAdminStats(db),
    getFeedRunsWithShops(db, 10),
    getClicksByShop(db),
  ]);

  const statItems = [
    { label: t("statProducts"), value: stats.products },
    { label: t("statOffers"), value: stats.offers },
    { label: t("statUnmatched"), value: stats.unmatched },
    { label: t("statAlerts"), value: stats.alerts },
  ];

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statItems.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <dt className="text-sm text-neutral-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-bold">{item.value}</dd>
          </div>
        ))}
      </dl>

      {clickStats.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("clicksTitle")}</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <tbody>
                {clickStats.map((row) => (
                  <tr key={row.shopName} className="border-b border-neutral-200 last:border-0 dark:border-neutral-800">
                    <td className="px-4 py-2.5">{row.shopName}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{row.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("lastImports")}</h2>
        {runs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {t("noRuns")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-900">
                  <th className="px-4 py-2 font-medium">{t("shopName")}</th>
                  <th className="px-4 py-2 font-medium">{t("runStarted")}</th>
                  <th className="px-4 py-2 font-medium">{t("runStatus")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("runItems")}</th>
                  <th className="px-4 py-2 text-right font-medium">{t("runCreatedUpdated")}</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(({ run, shopName }) => (
                  <tr
                    key={run.id}
                    className="border-b border-neutral-200 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2.5">{shopName}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{formatDateTime(run.startedAt)}</td>
                    <td className="px-4 py-2.5">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right">{run.offersTotal}</td>
                    <td className="px-4 py-2.5 text-right">
                      {run.offersCreated} / {run.offersUpdated}
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

function RunStatusBadge({ status }: { status: "running" | "success" | "error" }) {
  const styles = {
    running: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  } as const;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
