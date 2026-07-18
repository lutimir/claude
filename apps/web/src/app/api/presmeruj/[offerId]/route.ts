import { schema } from "@app0/db";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Preklik na obchod: zaloguje klik a presmeruje — cez affiliate šablónu
 * obchodu ({url} placeholder), inak priamo. Odkazy naň nesú rel="sponsored".
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> },
): Promise<Response> {
  const { offerId } = await params;
  const id = Number(offerId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.redirect(new URL("/", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }

  const db = getDb();
  const offer = await db.query.offers.findFirst({
    where: eq(schema.offers.id, id),
    with: { shop: { columns: { affiliateTemplate: true } } },
  });
  if (!offer) {
    return Response.redirect(new URL("/", process.env.APP_BASE_URL ?? "http://localhost:3000"));
  }

  await db.insert(schema.clicks).values({ offerId: id });

  const target = offer.shop.affiliateTemplate
    ? offer.shop.affiliateTemplate.replace("{url}", encodeURIComponent(offer.url))
    : offer.url;
  return Response.redirect(target, 302);
}
