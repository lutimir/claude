import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * as schema from "./schema";
export * from "./aggregations";

export type Db = ReturnType<typeof createDb>;

/**
 * Vytvorí databázového klienta. Volajúci je zodpovedný za ukončenie spojenia
 * (`await db.$client.end()`) v krátkožijúcich procesoch (CLI, seed).
 */
export function createDb(url?: string) {
  const connectionString = url ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL nie je nastavená — skopíruj .env.example do .env");
  }
  const client = postgres(connectionString, { max: 10, onnotice: () => {} });
  return drizzle(client, { schema });
}
