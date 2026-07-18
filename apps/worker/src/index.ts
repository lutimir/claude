import "./env";
import { Cron } from "croner";
import { createDb } from "@app0/db";
import { pruneOldPriceHistory, snapshotTodayAggregates } from "@app0/db";
import { checkAlerts } from "./jobs/checkAlerts";
import { findMatchCandidates } from "./jobs/findMatchCandidates";
import { importAllFeeds } from "./jobs/importFeeds";
import { processImportJobs } from "./jobs/processImportJobs";
import { log } from "./lib/log";

const db = createDb();

log(
  "Worker beží. Denný import feedov o 03:00, kontrola alarmov o 03:30, " +
    "fronta manuálnych importov každých 30 s.",
);

let processingJobs = false;
new Cron("*/30 * * * * *", () => {
  if (processingJobs) return; // neprekrývaj dlhé importy
  processingJobs = true;
  processImportJobs(db)
    .catch((err) => log(`Spracovanie import jobov zlyhalo: ${err}`))
    .finally(() => {
      processingJobs = false;
    });
});

new Cron("0 3 * * *", { timezone: "Europe/Bratislava" }, () => {
  importAllFeeds(db)
    .then(() => findMatchCandidates(db))
    .then(() => snapshotTodayAggregates(db))
    .then(() => pruneOldPriceHistory(db))
    .catch((err) => log(`Denný import zlyhal: ${err}`));
});

new Cron("30 3 * * *", { timezone: "Europe/Bratislava" }, () => {
  checkAlerts(db).catch((err) => log(`Kontrola alarmov zlyhala: ${err}`));
});
