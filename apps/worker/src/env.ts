import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Načíta .env z koreňa monorepa (v Dockeri prichádzajú premenné z prostredia).
const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
