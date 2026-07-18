"use server";

import { schema } from "@app0/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

async function moderate(formData: FormData, status: "approved" | "rejected"): Promise<void> {
  const reviewId = Number(formData.get("reviewId"));
  if (Number.isInteger(reviewId) && reviewId > 0) {
    await getDb()
      .update(schema.shopReviews)
      .set({ status })
      .where(eq(schema.shopReviews.id, reviewId));
  }
  revalidatePath("/admin/recenzie");
  redirect("/admin/recenzie");
}

export async function approveReview(formData: FormData): Promise<void> {
  await moderate(formData, "approved");
}

export async function rejectReview(formData: FormData): Promise<void> {
  await moderate(formData, "rejected");
}
