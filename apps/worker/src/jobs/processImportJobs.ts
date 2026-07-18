import { schema, snapshotTodayAggregates, type Db } from "@app0/db";
import { eq, sql } from "drizzle-orm";
import { log } from "../lib/log";
import { findMatchCandidates } from "./findMatchCandidates";
import { importAllFeeds, importFeedById } from "./importFeeds";
import { pingRevalidate } from "../lib/revalidate";

const MAX_JOBS_PER_TICK = 5;

/**
 * Spracuje frontu manuálnych importov z adminu (tabuľka import_jobs).
 * Job berie atomicky (FOR UPDATE SKIP LOCKED), takže pokojne môže bežať
 * viac workerov naraz.
 */
export async function processImportJobs(db: Db): Promise<void> {
  for (let i = 0; i < MAX_JOBS_PER_TICK; i++) {
    const [job] = await db
      .update(schema.importJobs)
      .set({ status: "running", startedAt: new Date() })
      .where(
        eq(
          schema.importJobs.id,
          sql`(select id from import_jobs where status = 'pending'
               order by requested_at limit 1 for update skip locked)`,
        ),
      )
      .returning();

    if (!job) return;

    log(`Spracúvam import job #${job.id} (${job.feedId ? `feed #${job.feedId}` : "všetky feedy"})`);
    try {
      if (job.feedId) {
        await importFeedById(db, job.feedId);
      } else {
        await importAllFeeds(db);
      }
      await findMatchCandidates(db);
      await snapshotTodayAggregates(db);
      await pingRevalidate();
      await db
        .update(schema.importJobs)
        .set({ status: "success", finishedAt: new Date() })
        .where(eq(schema.importJobs.id, job.id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(schema.importJobs)
        .set({ status: "error", finishedAt: new Date(), errorMessage: message })
        .where(eq(schema.importJobs.id, job.id));
      log(`Import job #${job.id} zlyhal: ${message}`);
    }
  }
}
