"use server";

import { randomUUID } from "node:crypto";
import { schema } from "@app0/db";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";

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

export async function createPriceAlert(formData: FormData): Promise<void> {
  const parsed = alertSchema.safeParse({
    productId: formData.get("productId"),
    slug: formData.get("slug"),
    email: formData.get("email"),
    targetPrice: formData.get("targetPrice"),
  });

  if (!parsed.success) {
    const rawSlug = String(formData.get("slug") ?? "");
    redirect(`/produkt/${encodeURIComponent(rawSlug)}?alarm=chyba`);
  }

  const { productId, slug, email, targetPrice } = parsed.data;
  await getDb()
    .insert(schema.priceAlerts)
    .values({
      productId,
      email,
      targetPrice: targetPrice.toFixed(2),
      token: randomUUID(),
      // Double opt-in cez e-mail dopĺňa fáza 3 — dovtedy je alarm potvrdený hneď.
      confirmedAt: new Date(),
    });

  redirect(`/produkt/${slug}?alarm=ok`);
}
