import { getTranslations } from "next-intl/server";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getFeedRunsWithShops, getImportJobs, hasActiveImportJobs } from "@/lib/queries";
import { requestImport } from "../obchody/actions";

export const dynamic = "force-dynamic";

const jobStatusStyles = {
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
} as const;

export default async function AdminImportsPage() {
  const t = await getTranslations("admin");
  const db = getDb();
  const [runs, jobs, hasActive] = await Promise.all([
    getFeedRunsWithShops(db, 50),
    getImportJobs(db, 10),
    hasActiveImportJobs(db),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AutoRefresh active={hasActive} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{t("jobsTitle")}</h2>
          <form action={requestImport}>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              {t("importAllNow")}
            </button>
          </form>
        </div>
        <p className="text-xs text-neutral-500">{t("workerHint")}</p>

        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {t("jobsEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-left dark:border-neutral-800 dark:bg-neutral-900">
                  <th className="px-4 py-2 font-medium">{t("feedUrl")}</th>
                  <th className="px-4 py-2 font-medium">{t("runStatus")}</th>
                  <th className="px-4 py-2 font-medium">{t("jobRequested")}</th>
                  <th className="px-4 py-2 font-medium">{t("jobFinished")}</th>
                  <th className="px-4 py-2 font-medium">{t("runError")}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(({ job, feedUrl, shopName }) => (
                  <tr
                    key={job.id}
                    className="border-b border-neutral-200 last:border-0 dark:border-neutral-800"
                  >
                    <td className="max-w-72 truncate px-4 py-2.5 text-xs">
                      {job.feedId ? `${shopName ?? "?"} — ${feedUrl ?? ""}` : t("jobAllFeeds")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${jobStatusStyles[job.status]}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {formatDateTime(job.requestedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-500">
                      {formatDateTime(job.finishedAt)}
                    </td>
                    <td className="max-w-64 truncate px-4 py-2.5 text-xs text-red-600 dark:text-red-400">
                      {job.errorMessage ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("lastImports")}</h2>
        {runs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {t("noRuns")}
          </p>
        ) : (
          <RunsTable />
        )}
      </section>
    </div>
  );

  function RunsTable() {
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
}
