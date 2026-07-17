import { getTranslations } from "next-intl/server";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getFeedRunsWithShops } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminImportsPage() {
  const t = await getTranslations("admin");
  const runs = await getFeedRunsWithShops(getDb(), 50);

  if (runs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t("noRuns")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-900">
            <th className="px-4 py-2 font-medium">{t("shopName")}</th>
            <th className="px-4 py-2 font-medium">{t("feedUrl")}</th>
            <th className="px-4 py-2 font-medium">{t("runStarted")}</th>
            <th className="px-4 py-2 font-medium">{t("runStatus")}</th>
            <th className="px-4 py-2 text-right font-medium">{t("runItems")}</th>
            <th className="px-4 py-2 text-right font-medium">{t("runCreatedUpdated")}</th>
            <th className="px-4 py-2 text-right font-medium">{t("runWarnings")}</th>
            <th className="px-4 py-2 font-medium">{t("runError")}</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(({ run, shopName, feedUrl }) => (
            <tr
              key={run.id}
              className="border-b border-neutral-200 last:border-0 dark:border-neutral-800"
            >
              <td className="px-4 py-2.5">{shopName}</td>
              <td className="max-w-64 truncate px-4 py-2.5 font-mono text-xs">{feedUrl}</td>
              <td className="px-4 py-2.5 text-neutral-500">{formatDateTime(run.startedAt)}</td>
              <td className="px-4 py-2.5">{run.status}</td>
              <td className="px-4 py-2.5 text-right">{run.offersTotal}</td>
              <td className="px-4 py-2.5 text-right">
                {run.offersCreated} / {run.offersUpdated}
              </td>
              <td className="px-4 py-2.5 text-right">{run.warningsCount}</td>
              <td className="max-w-64 truncate px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
                {run.errorMessage ?? ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
