import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getDb } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getUnmatchedOffers } from "@/lib/queries";
import { confirmMatch, rejectCandidate } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminMatchingPage() {
  const t = await getTranslations("admin");
  const offers = await getUnmatchedOffers(getDb());

  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {t("matchingEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500">{t("matchingHint")}</p>

      {offers.map((offer) => (
        <section
          key={offer.id}
          className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">{offer.title}</h2>
            <p className="text-sm text-neutral-500">
              {offer.shop.name} · {formatPrice(offer.price, offer.currency)}
            </p>
          </div>

          {offer.matchCandidates.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-3 text-sm text-neutral-500 dark:border-neutral-700">
              {t("matchingNoCandidates")}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {offer.matchCandidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {Math.round(candidate.score * 100)} %
                    </span>
                    <Link
                      href={`/produkt/${candidate.product.slug}`}
                      target="_blank"
                      className="text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {candidate.product.name}
                    </Link>
                  </div>
                  <div className="flex gap-2">
                    <form action={confirmMatch}>
                      <input type="hidden" name="offerId" value={offer.id} />
                      <input type="hidden" name="productId" value={candidate.product.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                      >
                        {t("matchingConfirm")}
                      </button>
                    </form>
                    <form action={rejectCandidate}>
                      <input type="hidden" name="offerId" value={offer.id} />
                      <input type="hidden" name="productId" value={candidate.product.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        {t("matchingReject")}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
