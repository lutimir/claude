import "./env";
import { Cron } from "croner";
import { createDb } from "@app0/db";
import { checkAlerts } from "./jobs/checkAlerts";
import { importAllFeeds } from "./jobs/importFeeds";
import { log } from "./lib/log";

const db = createDb();

log("Worker beží. Denný import feedov o 03:00, kontrola cenových alarmov o 03:30.");

new Cron("0 3 * * *", { timezone: "Europe/Bratislava" }, () => {
  importAllFeeds(db).catch((err) => log(`Import feedov zlyhal: ${err}`));
});

new Cron("30 3 * * *", { timezone: "Europe/Bratislava" }, () => {
  checkAlerts(db).catch((err) => log(`Kontrola alarmov zlyhala: ${err}`));
});
