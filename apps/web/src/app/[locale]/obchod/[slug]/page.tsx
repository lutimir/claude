import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Stars } from "@/components/Stars";
import { getDb } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { getShopBySlug, getShopRatings } from "@/lib/queries";
import { createShopReview } from "./actions";

export const dynamic = "force-dynamic";

interface ShopPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ recenzia?: string }>;
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(getDb(), slug);
  return {
    title: shop?.name ?? "Obchod",
    alternates: { canonical: `/obchod/${slug}` },
  };
}

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-900";

export default async function ShopPage({ params, searchParams }: ShopPageProps) {
  const t = await getTranslations("review");
  const { slug } = await params;
  const { recenzia } = await searchParams;

  const db = getDb();
  const shop = await getShopBySlug(db, slug);
  if (!shop) notFound();

  const ratings = await getShopRatings(db, [shop.id]);
  const rating = ratings[shop.id];

  const statusMessages: Record<string, { text: string; tone: string }> = {
    skontroluj: { text: t("checkEmail"), tone: "text-emerald-700 dark:text-emerald-400" },
    limit: { text: t("limit"), tone: "text-amber-700 dark:text-amber-400" },
    chyba: { text: t("error"), tone: "text-red-600 dark:text-red-400" },
  };
  const statusMessage = recenzia ? statusMessages[recenzia] : undefined;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{shop.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <a
            href={shop.websiteUrl}
            target="_blank"
            rel="noopener nofollow"
            className="text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {shop.websiteUrl}
          </a>
          {rating ? (
            <span className="flex items-center gap-1.5">
              <Stars rating={rating.avg} />
              <span className="font-semibold">{rating.avg.toLocaleString("sk-SK")}</span>
              <span className="text-neutral-500">({t("count", { count: rating.count })})</span>
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">{t("title")}</h2>
          {shop.reviews.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {shop.reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-neutral-400">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  {review.text ? (
                    <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                      {review.text}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-semibold">{t("formTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("formDescription")}</p>
          {statusMessage ? (
            <p className={`mt-2 text-sm font-medium ${statusMessage.tone}`}>{statusMessage.text}</p>
          ) : null}
          <form action={createShopReview} className="mt-3 flex flex-col gap-3">
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="hidden" name="slug" value={shop.slug} />
            {/* Honeypot — pole neviditeľné pre ľudí, boty ho vyplnia */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <label>
                Web
                <input type="text" name="web" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <fieldset className="flex items-center gap-3 text-sm">
              <legend className="mb-1 font-medium">{t("rating")}</legend>
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    required
                    defaultChecked={value === 5}
                  />
                  {value}★
                </label>
              ))}
            </fieldset>

            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("text")}
              <textarea name="text" rows={3} maxLength={2000} className={inputClass} />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              {t("email")}
              <input type="email" name="email" required className={inputClass} />
            </label>

            <div>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              >
                {t("submit")}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
