import { schema, type Db } from "@app0/db";
import { and, asc, eq, isNotNull, isNull } from "drizzle-orm";
import { consoleMailer, type Mailer } from "../lib/mailer";
import { log } from "../lib/log";

/**
 * Prejde potvrdené a zatiaľ nenotifikované cenové alarmy; ak najlacnejšia
 * aktívna ponuka klesla na cieľovú cenu, pošle e-mail (zatiaľ konzolový stub).
 */
export async function checkAlerts(db: Db, mailer: Mailer = consoleMailer): Promise<void> {
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

    await mailer.send({
      to: alert.email,
      subject: `Cena klesla: ${product.name} je teraz za ${best.price} ${alert.currency}`,
      text:
        `Produkt ${product.name} klesol na ${best.price} ${alert.currency} ` +
        `(tvoja cieľová cena: ${alert.targetPrice} ${alert.currency}). Ponuka: ${best.url}`,
    });
    await db
      .update(schema.priceAlerts)
      .set({ notifiedAt: new Date() })
      .where(eq(schema.priceAlerts.id, alert.id));
    sent++;
  }
  log(`Skontrolovaných ${alerts.length} alarmov, odoslaných ${sent} notifikácií.`);
}
