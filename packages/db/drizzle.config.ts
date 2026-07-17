import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://app0:app0@localhost:5432/app0",
  },
});
