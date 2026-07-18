"use server";

import { randomUUID } from "node:crypto";
import { buildAlertConfirmationEmail, createMailer } from "@app0/core";
import { schema } from "@app0/db";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

const alertSchema = z.object({
  productId: z.coerce.number().int().positive(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  targetPrice: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(",", ".") : value),
    z.coerce.number().positive(),
  ),
});

const ALERTS_PER_IP_PER_HOUR = 5;

/**
 * Vytvorí cenový alarm s double opt-in: alarm vzniká nepotvrdený a aktivuje
 * sa až kliknutím na odkaz v potvrdzovacom e-maile. Opakované nastavenie
 * pre ten istý produkt a e-mail iba aktualizuje cieľovú cenu.
 */
export async function createPriceAlert(formData: FormData): Promise<void> {
  const rawSlug = encodeURIComponent(String(formData.get("slug") ?? ""));

  const parsed = alertSchema.safeParse({
    productId: formData.get("productId"),
    slug: formData.get("slug"),
    email: formData.get("email"),
    targetPrice: formData.get("targetPrice"),
  });
  if (!parsed.success) redirect(`/produkt/${rawSlug}?alarm=chyba`);

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`alert:${ip}`, ALERTS_PER_IP_PER_HOUR, 60 * 60 * 1000)) {
    redirect(`/produkt/${rawSlug}?alarm=limit`);
  }

  const { productId, slug, email, targetPrice } = parsed.data;
  const db = getDb();
  const product = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!product || product.slug !== slug) redirect(`/produkt/${rawSlug}?alarm=chyba`);

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const targetPriceStr = targetPrice.toFixed(2);

  const existing = await db.query.priceAlerts.findFirst({
    where: and(
      eq(schema.priceAlerts.productId, productId),
      eq(schema.priceAlerts.email, email),
      isNull(schema.priceAlerts.notifiedAt),
    ),
  });

  try {
    if (existing) {
      await db
        .update(schema.priceAlerts)
        .set({ targetPrice: targetPriceStr })
        .where(eq(schema.priceAlerts.id, existing.id));

      if (existing.confirmedAt) {
        redirect(`/produkt/${slug}?alarm=aktualizovane`);
      }
      // Nepotvrdený alarm: pošli potvrdenie znova s pôvodným tokenom
      await sendConfirmation(email, product.name, targetPriceStr, existing.token, baseUrl);
      redirect(`/produkt/${slug}?alarm=skontroluj`);
    }

    const token = randomUUID();
    await db.insert(schema.priceAlerts).values({
      productId,
      email,
      targetPrice: targetPriceStr,
      token,
      confirmedAt: null,
    });
    await sendConfirmation(email, product.name, targetPriceStr, token, baseUrl);
    redirect(`/produkt/${slug}?alarm=skontroluj`);
  } catch (err) {
    // redirect() vnútri try funguje cez výnimku — musí prejsť von
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("Odoslanie potvrdzovacieho e-mailu zlyhalo:", err);
    redirect(`/produkt/${slug}?alarm=chyba`);
  }
}

async function sendConfirmation(
  email: string,
  productName: string,
  targetPrice: string,
  token: string,
  baseUrl: string,
): Promise<void> {
  const mail = buildAlertConfirmationEmail({
    productName,
    targetPrice,
    currency: "EUR",
    confirmUrl: `${baseUrl}/alarm/${token}?akcia=potvrdit`,
  });
  await createMailer().send({ to: email, ...mail });
}
