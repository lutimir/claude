import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enumy
// ---------------------------------------------------------------------------

export const countryEnum = pgEnum("country_code", ["sk", "cz"]);
export const currencyEnum = pgEnum("currency", ["EUR", "CZK"]);
export const shopStatusEnum = pgEnum("shop_status", ["active", "paused"]);

/**
 * Právny základ, na ktorom od obchodu berieme dáta — jadro compliance modulu.
 * Bez vyplneného právneho základu a potvrdeného súhlasu sa feed neimportuje.
 */
export const legalBasisEnum = pgEnum("legal_basis", [
  "feed_consent", // obchod nám poskytol/potvrdil svoj produktový feed
  "official_api", // oficiálne API obchodu alebo affiliate siete
  "written_permission", // iné písomné povolenie
]);

export const feedFormatEnum = pgEnum("feed_format", ["heureka_xml"]);
export const feedRunStatusEnum = pgEnum("feed_run_status", ["running", "success", "error"]);

export const offerMatchStatusEnum = pgEnum("offer_match_status", [
  "matched_ean", // spárované cez EAN/GTIN
  "matched_fuzzy", // spárované fuzzy algoritmom (fáza 4)
  "matched_manual", // spárované ručne v admine
  "unmatched", // čaká na spárovanie
]);

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);

// ---------------------------------------------------------------------------
// Obchody a feedy
// ---------------------------------------------------------------------------

export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  websiteUrl: text("website_url").notNull(),
  country: countryEnum("country").notNull().default("sk"),
  status: shopStatusEnum("status").notNull().default("active"),
  legalBasis: legalBasisEnum("legal_basis").notNull(),
  contactEmail: text("contact_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feeds = pgTable("feeds", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  format: feedFormatEnum("format").notNull().default("heureka_xml"),
  enabled: boolean("enabled").notNull().default(true),
  /** Kedy obchod potvrdil, že jeho feed smieme používať. Bez toho sa neimportuje. */
  consentConfirmedAt: timestamp("consent_confirmed_at", { withTimezone: true }),
  consentNote: text("consent_note"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedRuns = pgTable(
  "feed_runs",
  {
    id: serial("id").primaryKey(),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    status: feedRunStatusEnum("status").notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    offersTotal: integer("offers_total").notNull().default(0),
    offersCreated: integer("offers_created").notNull().default(0),
    offersUpdated: integer("offers_updated").notNull().default(0),
    offersUnmatched: integer("offers_unmatched").notNull().default(0),
    warningsCount: integer("warnings_count").notNull().default(0),
    errorMessage: text("error_message"),
  },
  (t) => [index("feed_runs_feed_id_idx").on(t.feedId, t.startedAt)],
);

// ---------------------------------------------------------------------------
// Katalóg
// ---------------------------------------------------------------------------

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  parentId: integer("parent_id").references((): AnyPgColumn => categories.id),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    brandId: integer("brand_id").references(() => brands.id),
    categoryId: integer("category_id").references(() => categories.id),
    /** EAN/GTIN — primárny kľúč párovania ponúk naprieč obchodmi */
    ean: varchar("ean", { length: 14 }).unique(),
    mpn: text("mpn"),
    description: text("description"),
    imageUrl: text("image_url"),
    /** Parametre produktu (názov → hodnota), zdroj pre porovnávanie (fáza 5) */
    params: jsonb("params").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_brand_id_idx").on(t.brandId),
    index("products_category_id_idx").on(t.categoryId),
  ],
);

// ---------------------------------------------------------------------------
// Ponuky a ceny
// ---------------------------------------------------------------------------

export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    /** Null = ponuka zatiaľ nespárovaná so žiadnym produktom */
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    /** Názov produktu tak, ako ho uvádza obchod */
    title: text("title").notNull(),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("EUR"),
    availability: text("availability"),
    eanRaw: text("ean_raw"),
    matchStatus: offerMatchStatusEnum("match_status").notNull().default("unmatched"),
    /** false = položka zmizla z feedu (obchod ju už nepredáva) */
    active: boolean("active").notNull().default(true),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    priceUpdatedAt: timestamp("price_updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("offers_feed_external_idx").on(t.feedId, t.externalId),
    index("offers_product_id_idx").on(t.productId),
    index("offers_shop_id_idx").on(t.shopId),
    index("offers_match_status_idx").on(t.matchStatus),
  ],
);

/** Záznam ceny v čase — zapisuje sa pri prvom videní ponuky a pri každej zmene ceny. */
export const priceHistory = pgTable(
  "price_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("EUR"),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("price_history_offer_idx").on(t.offerId, t.recordedAt)],
);

// ---------------------------------------------------------------------------
// Cenové alarmy a recenzie (UI prichádza vo fázach 3 a 6)
// ---------------------------------------------------------------------------

export const priceAlerts = pgTable(
  "price_alerts",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    targetPrice: numeric("target_price", { precision: 12, scale: 2 }).notNull(),
    currency: currencyEnum("currency").notNull().default("EUR"),
    /** Token na potvrdenie e-mailu a odhlásenie (double opt-in — fáza 3) */
    token: text("token").notNull().unique(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("price_alerts_product_idx").on(t.productId)],
);

export const shopReviews = pgTable(
  "shop_reviews",
  {
    id: serial("id").primaryKey(),
    shopId: integer("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    rating: integer("rating").notNull(),
    text: text("text"),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shop_reviews_shop_idx").on(t.shopId)],
);

// ---------------------------------------------------------------------------
// Relácie (pre relačné dotazy cez db.query.*)
// ---------------------------------------------------------------------------

export const shopsRelations = relations(shops, ({ many }) => ({
  feeds: many(feeds),
  offers: many(offers),
  reviews: many(shopReviews),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  shop: one(shops, { fields: [feeds.shopId], references: [shops.id] }),
  runs: many(feedRuns),
  offers: many(offers),
}));

export const feedRunsRelations = relations(feedRuns, ({ one }) => ({
  feed: one(feeds, { fields: [feedRuns.feedId], references: [feeds.id] }),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryTree",
  }),
  children: many(categories, { relationName: "categoryTree" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  offers: many(offers),
  alerts: many(priceAlerts),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  product: one(products, { fields: [offers.productId], references: [products.id] }),
  shop: one(shops, { fields: [offers.shopId], references: [shops.id] }),
  feed: one(feeds, { fields: [offers.feedId], references: [feeds.id] }),
  history: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  offer: one(offers, { fields: [priceHistory.offerId], references: [offers.id] }),
}));

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  product: one(products, { fields: [priceAlerts.productId], references: [products.id] }),
}));

export const shopReviewsRelations = relations(shopReviews, ({ one }) => ({
  shop: one(shops, { fields: [shopReviews.shopId], references: [shops.id] }),
}));
