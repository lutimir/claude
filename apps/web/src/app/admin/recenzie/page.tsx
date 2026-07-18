import { getTranslations } from "next-intl/server";
import { Stars } from "@/components/Stars";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getReviewsForModeration } from "@/lib/queries";
import { approveReview, rejectReview } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const t = await getTranslations("admin");
  const { pending, unverifiedCount } = await getReviewsForModeration(getDb());

  return (
    <div className="flex flex-col gap-4">
      {unverifiedCount > 0 ? (
        <p className="text-sm text-neutral-500">
          {t("reviewsUnverified", { count: unverifiedCount })}
        </p>
      ) : null}

      {pending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {t("reviewsEmpty")}
        </p>
      ) : (
        pending.map(({ review, shopName }) => (
          <section
            key={review.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Stars rating={review.rating} />
                <span className="font-semibold">{shopName}</span>
              </div>
              <span className="text-xs text-neutral-400">
                {review.email} · {formatDateTime(review.createdAt)}
              </span>
            </div>
            {review.text ? (
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{review.text}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <form action={approveReview}>
                <input type="hidden" name="reviewId" value={review.id} />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                  {t("approve")}
                </button>
              </form>
              <form action={rejectReview}>
                <input type="hidden" name="reviewId" value={review.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {t("reject")}
                </button>
              </form>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
