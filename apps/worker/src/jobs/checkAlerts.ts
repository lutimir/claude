import { buildPriceDropEmail, createMailer, type Mailer } from "@app0/core";
import { schema, type Db } from "@app0/db";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { log } from "../lib/log";

/**
 * Prejde potvrdené a zatiaľ nenotifikované cenové alarmy; ak najlacnejšia
 * aktívna ponuka klesla na cieľovú cenu, pošle e-mail s ponukou a odkazom
 * na správu alarmu. Provider e-mailov sa vyberá cez MAIL_PROVIDER env.
 */
export async function checkAlerts(db: Db, mailer: Mailer = createMailer()): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const alerts = await db
    .select({ alert: schema.priceAlerts, product: schema.products })
    .from(schema.priceAlerts)
    .innerJoin(schema.products, eq(schema.priceAlerts.productId, schema.products.id))
    .where(and(isNull(schema.priceAlerts.notifiedAt), isNotNull(schema.priceAlerts.confirmedAt)));

  if (alerts.length === 0) {
    log("Žiadne čakajúce cenové alarmy.");
    return;
  }

  let sent = 0;
  for (const { alert, product } of alerts) {
    const [best] = await db
      .select({ price: schema.offers.price, url: schema.offers.url })
      .from(schema.offers)
      .where(
        and(
          eq(schema.offers.productId, product.id),
          eq(schema.offers.active, true),
          eq(schema.offers.currency, alert.currency),
        ),
      )
      .orderBy(asc(schema.offers.price))
      .limit(1);

    if (!best || Number(best.price) > Number(alert.targetPrice)) continue;

    const mail = buildPriceDropEmail({
      productName: product.name,
      price: best.price,
      currency: alert.currency,
      targetPrice: alert.targetPrice,
      offerUrl: best.url,
      manageUrl: `${baseUrl}/alarm/${alert.token}`,
    });
    await mailer.send({ to: alert.email, ...mail });
    await db
      .update(schema.priceAlerts)
      .set({ notifiedAt: new Date() })
      .where(eq(schema.priceAlerts.id, alert.id));
    sent++;
  }
  log(`Skontrolovaných ${alerts.length} alarmov, odoslaných ${sent} notifikácií.`);
}
