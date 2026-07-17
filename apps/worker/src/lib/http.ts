import { buildFeedUserAgent } from "@app0/core";

const MAX_FEED_BYTES = 100 * 1024 * 1024; // 100 MB
const FETCH_TIMEOUT_MS = 120_000;

/**
 * Stiahne XML feed. Každý request sa transparentne identifikuje User-Agentom
 * s kontaktom (FEED_FETCH_CONTACT), aby obchod vedel, kto feed odoberá.
 */
export async function fetchFeedXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": buildFeedUserAgent(process.env.FEED_FETCH_CONTACT),
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} pri sťahovaní feedu ${url}`);
  }
  const text = await res.text();
  if (text.length > MAX_FEED_BYTES) {
    throw new Error(`Feed ${url} presiahol limit ${MAX_FEED_BYTES} bajtov`);
  }
  return text;
}
