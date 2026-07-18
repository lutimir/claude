"use server";

import { schema, snapshotTodayAggregates } from "@app0/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

function idsFrom(formData: FormData): { offerId: number; productId: number } {
  const offerId = Number(formData.get("offerId"));
  const productId = Number(formData.get("productId"));
  if (!Number.isInteger(offerId) || offerId <= 0 || !Number.isInteger(productId) || productId <= 0) {
    redirect("/admin/parovanie");
  }
  return { offerId, productId };
}

/** Ručné potvrdenie kandidáta — ponuka sa priradí k produktu. */
export async function confirmMatch(formData: FormData): Promise<void> {
  const { offerId, productId } = idsFrom(formData);
  const db = getDb();

  const product = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!product) redirect("/admin/parovanie");

  await db
    .update(schema.offers)
    .set({ productId, matchStatus: "matched_manual" })
    .where(eq(schema.offers.id, offerId));
  await db.delete(schema.matchCandidates).where(eq(schema.matchCandidates.offerId, offerId));
  await snapshotTodayAggregates(db);

  revalidatePath("/admin/parovanie");
  redirect("/admin/parovanie");
}

/** Zamietnutie kandidáta — pár ide do blocklistu a už sa nenavrhne. */
export async function rejectCandidate(formData: FormData): Promise<void> {
  const { offerId, productId } = idsFrom(formData);
  const db = getDb();

  await db
    .insert(schema.matchRejections)
    .values({ offerId, productId })
    .onConflictDoNothing();
  await db
    .delete(schema.matchCandidates)
    .where(
      and(
        eq(schema.matchCandidates.offerId, offerId),
        eq(schema.matchCandidates.productId, productId),
      ),
    );

  revalidatePath("/admin/parovanie");
  redirect("/admin/parovanie");
}
