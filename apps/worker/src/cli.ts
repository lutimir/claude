import "./env";
import {
  backfillAggregatesFromHistory,
  createDb,
  pruneOldPriceHistory,
  snapshotTodayAggregates,
} from "@app0/db";
import { checkAlerts } from "./jobs/checkAlerts";
import { findMatchCandidates } from "./jobs/findMatchCandidates";
import { importAllFeeds } from "./jobs/importFeeds";
import { processImportJobs } from "./jobs/processImportJobs";

const command = process.argv[2];
const db = createDb();

try {
  if (command === "import-feeds") {
    await importAllFeeds(db);
    await findMatchCandidates(db);
    await snapshotTodayAggregates(db);
  } else if (command === "match-candidates") {
    await findMatchCandidates(db);
  } else if (command === "check-alerts") {
    await checkAlerts(db);
  } else if (command === "process-jobs") {
    await processImportJobs(db);
  } else if (command === "aggregate") {
    await snapshotTodayAggregates(db);
  } else if (command === "aggregate-backfill") {
    await backfillAggregatesFromHistory(db);
    await snapshotTodayAggregates(db);
  } else if (command === "prune-history") {
    await pruneOldPriceHistory(db);
  } else {
    console.error(
      "Použitie: tsx src/cli.ts <import-feeds|match-candidates|check-alerts" +
        "|process-jobs|aggregate|aggregate-backfill|prune-history>",
    );
    process.exitCode = 1;
  }
} finally {
  await db.$client.end();
}
