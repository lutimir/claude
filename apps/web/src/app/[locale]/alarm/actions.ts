"use server";

import { schema } from "@app0/db";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

function tokenFrom(formData: FormData): string {
  const token = String(formData.get("token") ?? "");
  if (!/^[a-f0-9-]{36}$/.test(token)) redirect("/");
  return token;
}

export async function confirmAlert(formData: FormData): Promise<void> {
  const token = tokenFrom(formData);
  await getDb()
    .update(schema.priceAlerts)
    .set({ confirmedAt: new Date() })
    .where(and(eq(schema.priceAlerts.token, token), isNull(schema.priceAlerts.confirmedAt)));
  redirect(`/alarm/${token}`);
}

/** Po odoslanej notifikácii nastaví stráženie odznova. */
export async function rearmAlert(formData: FormData): Promise<void> {
  const token = tokenFrom(formData);
  await getDb()
    .update(schema.priceAlerts)
    .set({ notifiedAt: null })
    .where(eq(schema.priceAlerts.token, token));
  redirect(`/alarm/${token}`);
}

export async function cancelAlert(formData: FormData): Promise<void> {
  const token = tokenFrom(formData);
  await getDb().delete(schema.priceAlerts).where(eq(schema.priceAlerts.token, token));
  redirect(`/alarm/${token}?stav=zruseny`);
}
