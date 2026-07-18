"use server";

import {
  buildFeedPreview,
  fetchFeedXml,
  parseHeurekaFeed,
  slugify,
  type FeedPreview,
} from "@app0/core";
import { schema } from "@app0/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";

// ---------------------------------------------------------------------------
// Obchody
// ---------------------------------------------------------------------------

const shopSchema = z.object({
  name: z.string().trim().min(2, "Názov musí mať aspoň 2 znaky").max(200),
  websiteUrl: z
    .string()
    .trim()
    .url("Zadaj platnú URL")
    .refine((value) => value.startsWith("http"), "URL musí začínať http(s)"),
  country: z.enum(["sk", "cz"]),
  legalBasis: z.enum(["feed_consent", "official_api", "written_permission"]),
  contactEmail: z
    .union([z.literal(""), z.string().trim().email("Neplatný e-mail")])
    .transform((value) => value || null),
  status: z.enum(["active", "paused"]).default("active"),
});

function firstError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Neplatné dáta";
}

export async function createShop(formData: FormData): Promise<void> {
  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/obchody/novy?chyba=${encodeURIComponent(firstError(parsed.error))}`);
  }

  const db = getDb();
  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  for (let suffix = 2; ; suffix++) {
    const existing = await db.query.shops.findFirst({ where: eq(schema.shops.slug, slug) });
    if (!existing) break;
    if (suffix > 5) {
      redirect(
        `/admin/obchody/novy?chyba=${encodeURIComponent("Obchod s podobným názvom už existuje")}`,
      );
    }
    slug = `${baseSlug}-${suffix}`;
  }

  const [shop] = await db
    .insert(schema.shops)
    .values({ ...parsed.data, slug })
    .returning();
  revalidatePath("/admin/obchody");
  redirect(`/admin/obchody/${shop!.id}?ulozene=1`);
}

export async function updateShop(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/obchody");

  const parsed = shopSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/obchody/${id}?chyba=${encodeURIComponent(firstError(parsed.error))}`);
  }

  const db = getDb();
  await db
    .update(schema.shops)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.shops.id, id));
  revalidatePath("/admin/obchody");
  redirect(`/admin/obchody/${id}?ulozene=1`);
}

// ---------------------------------------------------------------------------
// Feedy — validácia s náhľadom a uloženie (jedna akcia s intentom)
// ---------------------------------------------------------------------------

export interface FeedFormState {
  status: "idle" | "error" | "validated";
  message?: string;
  preview?: FeedPreview;
}

const feedSchema = z.object({
  shopId: z.coerce.number().int().positive(),
  feedId: z.coerce.number().int().positive().optional(),
  url: z
    .string()
    .trim()
    .url("Zadaj platnú URL feedu")
    .refine((value) => value.startsWith("http"), "URL musí začínať http(s)"),
  consentNote: z.string().trim().max(2000),
  consentContact: z.string().trim().max(300),
});

export async function feedFormAction(
  _previous: FeedFormState,
  formData: FormData,
): Promise<FeedFormState> {
  const intent = formData.get("intent");
  const parsed = feedSchema.safeParse({
    shopId: formData.get("shopId"),
    feedId: formData.get("feedId") || undefined,
    url: formData.get("url"),
    consentNote: formData.get("consentNote") ?? "",
    consentContact: formData.get("consentContact") ?? "",
  });
  if (!parsed.success) return { status: "error", message: firstError(parsed.error) };

  const enabled = formData.get("enabled") === "on";
  const consentConfirmed = formData.get("consentConfirmed") === "on";
  const { shopId, feedId, url, consentNote, consentContact } = parsed.data;

  if (intent === "validate") {
    try {
      const xml = await fetchFeedXml(url, {
        contact: process.env.FEED_FETCH_CONTACT,
        timeoutMs: 30_000,
      });
      return { status: "validated", preview: buildFeedPreview(parseHeurekaFeed(xml)) };
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : String(err) };
    }
  }

  if (consentConfirmed && consentNote.length < 3) {
    return { status: "error", message: "Doplň poznámku, ako a kedy bol súhlas udelený" };
  }

  const db = getDb();
  const shop = await db.query.shops.findFirst({ where: eq(schema.shops.id, shopId) });
  if (!shop) return { status: "error", message: "Obchod neexistuje" };

  if (feedId) {
    const existing = await db.query.feeds.findFirst({ where: eq(schema.feeds.id, feedId) });
    if (!existing || existing.shopId !== shopId) {
      return { status: "error", message: "Feed neexistuje" };
    }
    await db
      .update(schema.feeds)
      .set({
        url,
        enabled,
        // Pôvodný dátum súhlasu sa zachováva; odškrtnutie súhlas odvolá
        consentConfirmedAt: consentConfirmed ? (existing.consentConfirmedAt ?? new Date()) : null,
        consentNote: consentNote || null,
        consentContact: consentContact || null,
      })
      .where(eq(schema.feeds.id, feedId));
  } else {
    await db.insert(schema.feeds).values({
      shopId,
      url,
      enabled,
      consentConfirmedAt: consentConfirmed ? new Date() : null,
      consentNote: consentNote || null,
      consentContact: consentContact || null,
    });
  }
  revalidatePath("/admin/obchody");
  redirect(`/admin/obchody/${shopId}?ulozene=1`);
}

// ---------------------------------------------------------------------------
// Manuálny import — vloží job do fronty, ktorú spracúva worker
// ---------------------------------------------------------------------------

export async function requestImport(formData: FormData): Promise<void> {
  const raw = formData.get("feedId");
  const feedId = raw ? Number(raw) : null;
  if (feedId !== null && (!Number.isInteger(feedId) || feedId <= 0)) {
    redirect("/admin/importy");
  }

  const db = getDb();
  const duplicate = await db.query.importJobs.findFirst({
    where: and(
      feedId === null ? isNull(schema.importJobs.feedId) : eq(schema.importJobs.feedId, feedId),
      inArray(schema.importJobs.status, ["pending", "running"]),
    ),
  });
  if (!duplicate) {
    await db.insert(schema.importJobs).values({ feedId });
  }
  revalidatePath("/admin/importy");
  redirect("/admin/importy");
}
