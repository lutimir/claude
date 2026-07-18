"use server";

import { randomUUID } from "node:crypto";
import { buildReviewVerificationEmail, createMailer } from "@app0/core";
import { schema } from "@app0/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

const reviewSchema = z.object({
  shopId: z.coerce.number().int().positive(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(2000),
});

const REVIEWS_PER_IP_PER_HOUR = 3;

/**
 * Verejné hodnotenie obchodu: anti-spam honeypot + rate limit, e-mail
 * verifikácia tokenom a následná moderácia v admine. E-mail sa nikdy
 * nezverejňuje.
 */
export async function createShopReview(formData: FormData): Promise<void> {
  const rawSlug = encodeURIComponent(String(formData.get("slug") ?? ""));

  // Honeypot: skryté pole "web" vyplní len bot — tvárime sa, že prešlo
  if (String(formData.get("web") ?? "") !== "") {
    redirect(`/obchod/${rawSlug}?recenzia=skontroluj`);
  }

  const parsed = reviewSchema.safeParse({
    shopId: formData.get("shopId"),
    slug: formData.get("slug"),
    email: formData.get("email"),
    rating: formData.get("rating"),
    text: formData.get("text") ?? "",
  });
  if (!parsed.success) redirect(`/obchod/${rawSlug}?recenzia=chyba`);

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`review:${ip}`, REVIEWS_PER_IP_PER_HOUR, 60 * 60 * 1000)) {
    redirect(`/obchod/${rawSlug}?recenzia=limit`);
  }

  const { shopId, slug, email, rating, text } = parsed.data;
  const db = getDb();
  const shop = await db.query.shops.findFirst({ where: eq(schema.shops.id, shopId) });
  if (!shop || shop.slug !== slug) redirect(`/obchod/${rawSlug}?recenzia=chyba`);

  try {
    const token = randomUUID();
    await db.insert(schema.shopReviews).values({
      shopId,
      email,
      rating,
      text: text || null,
      token,
    });

    const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const mail = buildReviewVerificationEmail({
      shopName: shop.name,
      verifyUrl: `${baseUrl}/recenzia/${token}`,
    });
    await createMailer().send({ to: email, ...mail });

    redirect(`/obchod/${slug}?recenzia=skontroluj`);
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("Odoslanie overovacieho e-mailu recenzie zlyhalo:", err);
    redirect(`/obchod/${slug}?recenzia=chyba`);
  }
}
