import "./env";
import { createDb } from "@app0/db";
import { checkAlerts } from "./jobs/checkAlerts";
import { importAllFeeds } from "./jobs/importFeeds";
import { processImportJobs } from "./jobs/processImportJobs";

const command = process.argv[2];
const db = createDb();

try {
  if (command === "import-feeds") {
    await importAllFeeds(db);
  } else if (command === "check-alerts") {
    await checkAlerts(db);
  } else if (command === "process-jobs") {
    await processImportJobs(db);
  } else {
    console.error("Použitie: tsx src/cli.ts <import-feeds|check-alerts|process-jobs>");
    process.exitCode = 1;
  }
} finally {
  await db.$client.end();
}
