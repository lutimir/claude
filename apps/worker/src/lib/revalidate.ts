import { log } from "./log";

/**
 * Best-effort invalidácia katalógovej cache webu po importe.
 * Bez APP_BASE_URL + REVALIDATE_SECRET sa nič nedeje (cache má TTL 5 min).
 */
export async function pingRevalidate(): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) return;
  try {
    const res = await fetch(`${baseUrl}/api/revalidate`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    log("Katalógová cache webu invalidovaná.");
  } catch (err) {
    log(`Revalidácia cache zlyhala (web pobeží na TTL): ${err}`);
  }
}
