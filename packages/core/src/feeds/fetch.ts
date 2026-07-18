import { buildFeedUserAgent } from "../compliance/userAgent";

const MAX_FEED_BYTES = 100 * 1024 * 1024; // 100 MB
const DEFAULT_TIMEOUT_MS = 120_000;

export interface FetchFeedOptions {
  /** Kontakt do User-Agenta (FEED_FETCH_CONTACT) — compliance identifikácia */
  contact?: string;
  timeoutMs?: number;
}

/**
 * Stiahne XML feed. Každý request sa transparentne identifikuje User-Agentom
 * s kontaktom, aby obchod vedel, kto feed odoberá.
 */
export async function fetchFeedXml(url: string, options: FetchFeedOptions = {}): Promise<string> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Neplatná URL feedu: ${url}`);
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Feed musí byť http(s), dostal som: ${parsedUrl.protocol}`);
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": buildFeedUserAgent(options.contact),
      accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
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
