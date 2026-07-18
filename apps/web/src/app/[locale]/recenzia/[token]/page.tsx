import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { schema } from "@app0/db";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface VerifyReviewPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("review");
  return { title: t("verifyTitle"), robots: { index: false } };
}

/** Overenie recenzie kliknutím na odkaz z e-mailu (idempotentné). */
export default async function VerifyReviewPage({ params }: VerifyReviewPageProps) {
  const t = await getTranslations("review");
  const { token } = await params;

  const db = getDb();
  const review = /^[a-f0-9-]{36}$/.test(token)
    ? await db.query.shopReviews.findFirst({
        where: eq(schema.shopReviews.token, token),
        with: { shop: { columns: { name: true, slug: true } } },
      })
    : undefined;

  if (review && !review.verifiedAt) {
    await db
      .update(schema.shopReviews)
      .set({ verifiedAt: new Date() })
      .where(eq(schema.shopReviews.id, review.id));
  }

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-xl font-bold">{t("verifyTitle")}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-300">
        {review ? t("verifyOk") : t("verifyMissing")}
      </p>
      {review ? (
        <Link
          href={`/obchod/${review.shop.slug}`}
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t("backToShop")}
        </Link>
      ) : null}
    </div>
  );
}
