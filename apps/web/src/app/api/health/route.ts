import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/** Healthcheck pre reverse proxy, compose a uptime monitoring. */
export async function GET(): Promise<Response> {
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", db: true });
  } catch {
    return Response.json({ status: "error", db: false }, { status: 503 });
  }
}
