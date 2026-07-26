import { schema, snapshotTodayAggregates, type Db } from "@app0/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { log } from "../lib/log";

/** Minimálne skóre, aby sa produkt vôbec navrhol ako kandidát */
const CANDIDATE_THRESHOLD = Number(process.env.FUZZY_CANDIDATE_THRESHOLD ?? 0.45);
/** Skóre, od ktorého sa ponuka spáruje automaticky (matched_fuzzy) */
const AUTO_MATCH_THRESHOLD = Number(process.env.FUZZY_AUTO_THRESHOLD ?? 0.85);
const MAX_CANDIDATES_PER_OFFER = 3;
/**
 * Strop ponúk na jeden beh — trigram hľadanie stojí ~50 ms na ponuku, takže
 * feed s tisíckami položiek bez EAN by inak držal worker (a frontu importov)
 * blokovaný desiatky minút. Zvyšok sa spracuje v ďalšom behu; ponuky sa berú
 * od najnovšie videných.
 */
const MAX_OFFERS_PER_RUN = Number(process.env.FUZZY_MAX_OFFERS_PER_RUN ?? 500);

interface CandidateRow {
  product_id: number;
  score: number;
  strict_score: number;
}

/**
 * Pre aktívne nespárované ponuky navrhne kandidátov cez pg_trgm similarity
 * nad normalizovanými názvami (unaccent + lower). Nad AUTO_MATCH_THRESHOLD
 * páruje automaticky; zamietnuté páry (match_rejections) sa nikdy nenavrhnú
 * znova. Beží po každom importe.
 */
export async function findMatchCandidates(db: Db): Promise<void> {
  const [totals] = await db
    .select({ total: sql<number>`count(*)`.mapWith(Number) })
    .from(schema.offers)
    .where(and(eq(schema.offers.active, true), eq(schema.offers.matchStatus, "unmatched")));

  const unmatched = await db
    .select({ id: schema.offers.id, title: schema.offers.title })
    .from(schema.offers)
    .where(and(eq(schema.offers.active, true), eq(schema.offers.matchStatus, "unmatched")))
    .orderBy(desc(schema.offers.lastSeenAt))
    .limit(MAX_OFFERS_PER_RUN);

  let autoMatched = 0;
  let candidateCount = 0;

  for (const offer of unmatched) {
    // Skóre kandidáta: greatest(similarity, word_similarity) — word_similarity
    // meria zhodu názvu produktu vnútri dlhšieho titulu ponuky (obchody
    // pridávajú do názvov omáčku). Auto-match ale vyžaduje prísnu plnú
    // similarity, aby krátky názov vnorený v nesúvisiacom titule nespároval.
    const rows = (await db.execute(sql`
      select p.id as product_id,
             greatest(
               similarity(immutable_unaccent(lower(p.name)), immutable_unaccent(lower(${offer.title}))),
               word_similarity(immutable_unaccent(lower(p.name)), immutable_unaccent(lower(${offer.title})))
             ) as score,
             similarity(immutable_unaccent(lower(p.name)), immutable_unaccent(lower(${offer.title}))) as strict_score
      from products p
      where greatest(
              similarity(immutable_unaccent(lower(p.name)), immutable_unaccent(lower(${offer.title}))),
              word_similarity(immutable_unaccent(lower(p.name)), immutable_unaccent(lower(${offer.title})))
            ) >= ${CANDIDATE_THRESHOLD}
        and not exists (
          select 1 from match_rejections r
          where r.offer_id = ${offer.id} and r.product_id = p.id
        )
      order by score desc
      limit ${MAX_CANDIDATES_PER_OFFER}
    `)) as unknown as CandidateRow[];

    // Kandidáti sa vždy prepočítajú nanovo (názvy aj katalóg sa menia)
    await db.delete(schema.matchCandidates).where(eq(schema.matchCandidates.offerId, offer.id));
    if (rows.length === 0) continue;

    const best = rows[0]!;
    if (Number(best.strict_score) >= AUTO_MATCH_THRESHOLD) {
      await db
        .update(schema.offers)
        .set({ productId: best.product_id, matchStatus: "matched_fuzzy" })
        .where(eq(schema.offers.id, offer.id));
      autoMatched++;
      continue;
    }

    await db.insert(schema.matchCandidates).values(
      rows.map((row) => ({
        offerId: offer.id,
        productId: row.product_id,
        score: Number(row.score),
      })),
    );
    candidateCount += rows.length;
  }

  if (autoMatched > 0) await snapshotTodayAggregates(db);
  const total = totals?.total ?? unmatched.length;
  const rest = total - unmatched.length;
  log(
    `Fuzzy párovanie: spracovaných ${unmatched.length} z ${total} nespárovaných ponúk, ` +
      `${autoMatched} auto-spárovaných, ${candidateCount} navrhnutých kandidátov` +
      (rest > 0 ? ` (${rest} ostáva na ďalší beh).` : "."),
  );
}
