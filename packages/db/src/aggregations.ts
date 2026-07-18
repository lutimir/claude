import { sql } from "drizzle-orm";
import type { Db } from "./index";

/**
 * Upsert dnešných agregátov (min/avg/počet ponúk na produkt a menu)
 * z aktuálnych aktívnych ponúk. Volá sa po každom importe.
 */
export async function snapshotTodayAggregates(db: Db): Promise<void> {
  await db.execute(sql`
    insert into product_price_daily (product_id, day, currency, min_price, avg_price, offer_count)
    select o.product_id, current_date, o.currency,
           min(o.price), round(avg(o.price), 2), count(*)
    from offers o
    where o.active and o.product_id is not null
    group by o.product_id, o.currency
    on conflict (product_id, day, currency)
    do update set min_price = excluded.min_price,
                  avg_price = excluded.avg_price,
                  offer_count = excluded.offer_count
  `);
}

/**
 * Backfill agregátov z price_history — použiteľné po nasadení alebo seede.
 * Pokrýva len dni, v ktorých sa cena zapísala (medzery sa nedopĺňajú);
 * priebežné denné snapshoty ich odteraz dopĺňajú.
 */
export async function backfillAggregatesFromHistory(db: Db): Promise<void> {
  await db.execute(sql`
    insert into product_price_daily (product_id, day, currency, min_price, avg_price, offer_count)
    select o.product_id, date_trunc('day', ph.recorded_at)::date, ph.currency,
           min(ph.price), round(avg(ph.price), 2), count(distinct ph.offer_id)
    from price_history ph
    join offers o on o.id = ph.offer_id
    where o.product_id is not null
    group by o.product_id, date_trunc('day', ph.recorded_at)::date, ph.currency
    on conflict (product_id, day, currency)
    do update set min_price = excluded.min_price,
                  avg_price = excluded.avg_price,
                  offer_count = excluded.offer_count
  `);
}

/** Surové záznamy držíme ~13 mesiacov; dlhodobú históriu nesú denné agregáty. */
const RAW_HISTORY_RETENTION_DAYS = 400;

export async function pruneOldPriceHistory(db: Db): Promise<void> {
  await db.execute(sql`
    delete from price_history
    where recorded_at < now() - make_interval(days => ${RAW_HISTORY_RETENTION_DAYS})
  `);
}
