/**
 * Compliance zásada appky: dáta berieme výhradne z oficiálnych feedov a API,
 * ku ktorým dal obchod súhlas (feeds.consent_confirmed_at). Každý HTTP request
 * sa navyše transparentne identifikuje, aby obchod vždy vedel, kto a prečo
 * feed sťahuje, a mal na nás kontakt.
 */
export function buildFeedUserAgent(contact: string | undefined): string {
  const contactPart = contact?.trim() || "kontakt-nenastaveny";
  return `App0FeedBot/0.1 (porovnavac cien; feed so suhlasom obchodu; kontakt: ${contactPart})`;
}
