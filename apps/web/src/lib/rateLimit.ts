/**
 * Jednoduchý sliding-window rate limiter v pamäti procesu. Pri behu na
 * viacerých inštanciách limituje každú zvlášť — zdieľaný limiter (Redis/DB)
 * rieši fáza 9, na ochranu formulárov proti spamu toto stačí.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
