/**
 * Naplní databázu demo dátami: 2 fiktívne obchody, katalóg elektroniky,
 * ponuky s rôznymi cenami a 30 dní histórie cien. Feedy demo obchodov sú
 * vypnuté (enabled=false) — reálne obchody sa pripájajú vo fáze 1 roadmapy.
 *
 * POZOR: seed je deštruktívny — premaže všetky dáta (TRUNCATE ... CASCADE).
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eanCheckDigit, slugify } from "@app0/core";
import { sql } from "drizzle-orm";
import { backfillAggregatesFromHistory, createDb, schema, snapshotTodayAggregates } from "./index";

const envPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);

const db = createDb();

/** Demo EAN-13 s platnou kontrolnou číslicou (prefix mimo reálnych GS1 rozsahov). */
function demoEan(n: number): string {
  const body = `2001234500${String(n).padStart(2, "0")}`;
  return body + String(eanCheckDigit(body));
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  console.log("Mažem existujúce dáta…");
  await db.execute(sql`
    TRUNCATE shop_reviews, price_alerts, match_candidates, match_rejections,
      param_aliases, product_price_daily, price_history, offers, import_jobs,
      feed_runs, products, categories, brands, feeds, shops
    RESTART IDENTITY CASCADE
  `);

  console.log("Vkladám kategórie a značky…");
  const [rootCategory] = await db
    .insert(schema.categories)
    .values({ name: "Elektronika", slug: "elektronika" })
    .returning();

  const childCategoryNames = [
    "Mobilné telefóny",
    "Notebooky",
    "Slúchadlá",
    "Televízory",
    "Smart hodinky",
    "Príslušenstvo",
  ];
  const childCategories = await db
    .insert(schema.categories)
    .values(
      childCategoryNames.map((name) => ({
        name,
        slug: slugify(name),
        parentId: rootCategory!.id,
      })),
    )
    .returning();
  const categoryByName = new Map(childCategories.map((c) => [c.name, c.id]));

  const brandNames = ["Samsung", "Apple", "Xiaomi", "Sony", "Lenovo", "LG", "Garmin", "Logitech"];
  const insertedBrands = await db
    .insert(schema.brands)
    .values(brandNames.map((name) => ({ name, slug: slugify(name) })))
    .returning();
  const brandByName = new Map(insertedBrands.map((b) => [b.name, b.id]));

  console.log("Vkladám obchody a feedy…");
  const insertedShops = await db
    .insert(schema.shops)
    .values([
      {
        name: "TechMarket (demo)",
        slug: "techmarket-demo",
        websiteUrl: "https://demo.app0.local/techmarket",
        country: "sk" as const,
        legalBasis: "feed_consent" as const,
        contactEmail: "feeds@techmarket.demo",
      },
      {
        name: "ElektroDom (demo)",
        slug: "elektrodom-demo",
        websiteUrl: "https://demo.app0.local/elektrodom",
        country: "sk" as const,
        legalBasis: "feed_consent" as const,
        contactEmail: "feeds@elektrodom.demo",
      },
    ])
    .returning();
  const [techMarket, elektroDom] = insertedShops;

  const insertedFeeds = await db
    .insert(schema.feeds)
    .values([
      {
        shopId: techMarket!.id,
        url: "https://demo.app0.local/feeds/techmarket.xml",
        enabled: false,
        consentConfirmedAt: new Date(),
        consentNote: "Demo dáta — fiktívny obchod na vývoj. Reálne feedy pripája fáza 1.",
      },
      {
        shopId: elektroDom!.id,
        url: "https://demo.app0.local/feeds/elektrodom.xml",
        enabled: false,
        consentConfirmedAt: new Date(),
        consentNote: "Demo dáta — fiktívny obchod na vývoj. Reálne feedy pripája fáza 1.",
      },
    ])
    .returning();
  const [techMarketFeed, elektroDomFeed] = insertedFeeds;

  console.log("Vkladám produkty…");
  interface DemoProduct {
    name: string;
    brand: string;
    category: string;
    price: number;
    description: string;
    params: Record<string, string>;
    /** či ho predáva aj druhý obchod */
    inSecondShop: boolean;
  }

  const demoProducts: DemoProduct[] = [
    {
      name: "Samsung Galaxy S24 128 GB čierny",
      brand: "Samsung",
      category: "Mobilné telefóny",
      price: 649.9,
      description: "Kompaktná vlajková loď s 6,2\" AMOLED displejom a podporou Galaxy AI.",
      params: { "Pamäť": "128 GB", Farba: "čierna", Displej: "6,2\" AMOLED", RAM: "8 GB" },
      inSecondShop: true,
    },
    {
      name: "Apple iPhone 15 128 GB modrý",
      brand: "Apple",
      category: "Mobilné telefóny",
      price: 799.0,
      description: "iPhone 15 s čipom A16 Bionic, Dynamic Island a 48 Mpx fotoaparátom.",
      params: { "Pamäť": "128 GB", Farba: "modrá", Displej: "6,1\" OLED", RAM: "6 GB" },
      inSecondShop: true,
    },
    {
      name: "Xiaomi Redmi Note 13 Pro 256 GB",
      brand: "Xiaomi",
      category: "Mobilné telefóny",
      price: 299.0,
      description: "Cenovo dostupný telefón s 200 Mpx fotoaparátom a rýchlym nabíjaním.",
      params: { "Pamäť": "256 GB", Farba: "čierna", Displej: "6,67\" AMOLED", RAM: "8 GB" },
      inSecondShop: true,
    },
    {
      name: "Sony WH-1000XM5 čierne",
      brand: "Sony",
      category: "Slúchadlá",
      price: 329.0,
      description: "Referenčné bezdrôtové slúchadlá s aktívnym potlačením hluku.",
      params: { Prevedenie: "cez uši", ANC: "áno", "Výdrž batérie": "30 h", Farba: "čierna" },
      inSecondShop: true,
    },
    {
      name: "Apple AirPods Pro 2 (USB-C)",
      brand: "Apple",
      category: "Slúchadlá",
      price: 279.0,
      description: "Slúchadlá do uší s ANC, adaptívnym zvukom a puzdrom s USB-C.",
      params: { Prevedenie: "do uší", ANC: "áno", "Výdrž batérie": "6 h", Farba: "biela" },
      inSecondShop: true,
    },
    {
      name: "Lenovo IdeaPad Slim 5 16 GB / 512 GB",
      brand: "Lenovo",
      category: "Notebooky",
      price: 699.0,
      description: "Univerzálny 16\" notebook s Ryzen 7 na prácu aj štúdium.",
      params: { Displej: "16\" WUXGA", RAM: "16 GB", Úložisko: "512 GB SSD", Procesor: "Ryzen 7" },
      inSecondShop: true,
    },
    {
      name: "Apple MacBook Air 13 M3 8 GB / 256 GB",
      brand: "Apple",
      category: "Notebooky",
      price: 1199.0,
      description: "Tenký a tichý notebook s čipom M3 a celodennou výdržou.",
      params: { Displej: "13,6\" Retina", RAM: "8 GB", Úložisko: "256 GB SSD", Procesor: "Apple M3" },
      inSecondShop: false,
    },
    {
      name: "Samsung QLED Q70D 55\"",
      brand: "Samsung",
      category: "Televízory",
      price: 749.0,
      description: "55-palcový QLED televízor so 120 Hz panelom, ideálny aj na hranie.",
      params: { Uhlopriečka: "55\"", Rozlíšenie: "4K", Panel: "QLED 120 Hz", "Smart TV": "Tizen" },
      inSecondShop: true,
    },
    {
      name: "LG OLED55B4 55\"",
      brand: "LG",
      category: "Televízory",
      price: 999.0,
      description: "OLED televízor s dokonalou čiernou a podporou Dolby Vision.",
      params: { Uhlopriečka: "55\"", Rozlíšenie: "4K", Panel: "OLED", "Smart TV": "webOS" },
      inSecondShop: false,
    },
    {
      name: "Apple Watch SE 2 44 mm",
      brand: "Apple",
      category: "Smart hodinky",
      price: 259.0,
      description: "Dostupné hodinky Apple so sledovaním aktivity a spánku.",
      params: { Veľkosť: "44 mm", GPS: "áno", "Výdrž batérie": "18 h", Farba: "polnočná" },
      inSecondShop: true,
    },
    {
      name: "Garmin Forerunner 265",
      brand: "Garmin",
      category: "Smart hodinky",
      price: 429.0,
      description: "Bežecké hodinky s AMOLED displejom a presnou GPS.",
      params: { Veľkosť: "46 mm", GPS: "multi-band", "Výdrž batérie": "13 dní", Displej: "AMOLED" },
      inSecondShop: false,
    },
    {
      name: "Logitech MX Master 3S grafitová",
      brand: "Logitech",
      category: "Príslušenstvo",
      price: 99.9,
      description: "Ergonomická kancelárska myš s tichými tlačidlami a MagSpeed kolieskom.",
      params: { Pripojenie: "Bluetooth / USB prijímač", Senzor: "8000 DPI", Farba: "grafitová" },
      inSecondShop: true,
    },
  ];

  const insertedProducts = await db
    .insert(schema.products)
    .values(
      demoProducts.map((p, i) => ({
        name: p.name,
        slug: slugify(p.name),
        brandId: brandByName.get(p.brand),
        categoryId: categoryByName.get(p.category),
        ean: demoEan(i + 1),
        description: p.description,
        params: p.params,
      })),
    )
    .returning();

  console.log("Vkladám ponuky a históriu cien…");
  let offerCount = 0;
  let historyCount = 0;

  for (const [i, demo] of demoProducts.entries()) {
    const product = insertedProducts[i]!;

    const shopsForProduct = [
      { shop: techMarket!, feed: techMarketFeed!, prefix: "TM", factor: 1.0 },
      ...(demo.inSecondShop
        ? [{ shop: elektroDom!, feed: elektroDomFeed!, prefix: "ED", factor: 0.96 + ((i * 7) % 9) / 100 }]
        : []),
    ];

    for (const { shop, feed, prefix, factor } of shopsForProduct) {
      const currentPrice = Math.round(demo.price * factor * 100) / 100;
      const [offer] = await db
        .insert(schema.offers)
        .values({
          productId: product.id,
          shopId: shop.id,
          feedId: feed.id,
          externalId: `${prefix}-${String(i + 1).padStart(3, "0")}`,
          title: demo.name,
          url: `${shop.websiteUrl}/produkt/${product.slug}`,
          price: currentPrice.toFixed(2),
          currency: "EUR",
          availability: "0",
          eanRaw: product.ean,
          matchStatus: "matched_ean",
        })
        .returning();
      offerCount++;

      // 30 dní histórie s deterministickým "šumom"; každý 4. produkt má
      // výraznú čerstvú zľavu (pred 5 dňami zlacnel o ~18 %) — dáta pre
      // sekciu "najväčšie poklesy cien" a detekciu falošných zliav
      const bigDrop = i % 4 === 0;
      const historyRows = [];
      for (let day = 30; day >= 0; day--) {
        const noise = (((i * 31 + day * 17) % 11) - 5) / 200; // ±2,5 %
        let price: number;
        if (day === 0) {
          price = currentPrice;
        } else if (bigDrop) {
          price =
            day > 4
              ? Math.round(currentPrice * (1.18 + noise) * 100) / 100
              : currentPrice;
        } else {
          const trend = 1 + (day / 30) * 0.06; // pred 30 dňami ~6 % drahšie
          price = Math.round(currentPrice * (trend + noise) * 100) / 100;
        }
        historyRows.push({
          offerId: offer!.id,
          price: price.toFixed(2),
          currency: "EUR" as const,
          recordedAt: new Date(Date.now() - day * DAY_MS),
        });
      }
      await db.insert(schema.priceHistory).values(historyRows);
      historyCount += historyRows.length;
    }
  }

  console.log("Vkladám ukážkové recenzie obchodov…");
  const demoReviews = [
    { shop: techMarket!, rating: 5, text: "Rýchle doručenie, tovar dorazil na druhý deň. Odporúčam." },
    { shop: techMarket!, rating: 4, text: "Dobré ceny, komunikácia mohla byť rýchlejšia." },
    { shop: techMarket!, rating: 5, text: "Bezproblémová reklamácia, vybavená do týždňa." },
    { shop: elektroDom!, rating: 4, text: "Solídny obchod, balenie v poriadku." },
    { shop: elektroDom!, rating: 3, text: "Tovar ok, ale doručenie meškalo dva dni." },
  ];
  await db.insert(schema.shopReviews).values(
    demoReviews.map((review, index) => ({
      shopId: review.shop.id,
      email: `zakaznik${index + 1}@example.com`,
      rating: review.rating,
      text: review.text,
      status: "approved" as const,
      token: crypto.randomUUID(),
      verifiedAt: new Date(),
    })),
  );

  console.log("Vkladám aliasy parametrov…");
  await db.insert(schema.paramAliases).values([
    { alias: "ulozisko", canonical: "Pamäť" },
    { alias: "kapacita uloziska", canonical: "Pamäť" },
    { alias: "obrazovka", canonical: "Displej" },
    { alias: "uhlopriecka displeja", canonical: "Uhlopriečka" },
    { alias: "vydrz na baterku", canonical: "Výdrž batérie" },
  ]);

  console.log("Počítam denné agregácie cien…");
  await backfillAggregatesFromHistory(db);
  await snapshotTodayAggregates(db);

  console.log(
    `Hotovo: ${insertedProducts.length} produktov, ${offerCount} ponúk, ` +
      `${historyCount} záznamov histórie cien, ${insertedShops.length} obchodov.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed zlyhal:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
