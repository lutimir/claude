import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// .env žije v koreni monorepa (v Dockeri prichádzajú premenné z prostredia)
const envPath = fileURLToPath(new URL("../../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  // Workspace balíky sa distribuujú ako TypeScript zdrojáky
  transpilePackages: ["@app0/db", "@app0/core"],
};

export default withNextIntl(nextConfig);
