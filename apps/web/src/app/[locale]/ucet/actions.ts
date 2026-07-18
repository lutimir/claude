"use server";

import { randomUUID } from "node:crypto";
import { buildMagicLinkEmail, createMailer } from "@app0/core";
import { schema } from "@app0/db";
import { and, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export async function sendMagicLink(formData: FormData): Promise<void> {
  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) redirect("/ucet?stav=chyba");

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${ip}`, 5, 60 * 60 * 1000)) redirect("/ucet?stav=limit");

  const token = randomUUID();
  await getDb()
    .insert(schema.loginTokens)
    .values({ token, email: parsed.data, expiresAt: new Date(Date.now() + 15 * 60_000) });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const mail = buildMagicLinkEmail({ loginUrl: `${baseUrl}/api/auth/${token}` });
  try {
    await createMailer().send({ to: parsed.data, ...mail });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("Magic link e-mail zlyhal:", err);
    redirect("/ucet?stav=chyba");
  }
  redirect("/ucet?stav=skontroluj");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(schema.sessions).where(eq(schema.sessions.token, token));
    cookieStore.delete(SESSION_COOKIE);
  }
  redirect("/ucet");
}

/** Prepínač obľúbeného produktu — len pre prihlásených. */
export async function toggleFavorite(formData: FormData): Promise<void> {
  const productId = Number(formData.get("productId"));
  const slug = String(formData.get("slug") ?? "");
  if (!Number.isInteger(productId) || productId <= 0 || !/^[a-z0-9-]+$/.test(slug)) redirect("/");

  const user = await getSessionUser();
  if (!user) redirect("/ucet");

  const db = getDb();
  const existing = await db.query.favorites.findFirst({
    where: and(eq(schema.favorites.userId, user.id), eq(schema.favorites.productId, productId)),
  });
  if (existing) {
    await db.delete(schema.favorites).where(eq(schema.favorites.id, existing.id));
  } else {
    await db.insert(schema.favorites).values({ userId: user.id, productId }).onConflictDoNothing();
  }
  redirect(`/produkt/${slug}`);
}
