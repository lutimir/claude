CREATE TYPE "public"."country_code" AS ENUM('sk', 'cz');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('EUR', 'CZK');--> statement-breakpoint
CREATE TYPE "public"."feed_format" AS ENUM('heureka_xml');--> statement-breakpoint
CREATE TYPE "public"."feed_run_status" AS ENUM('running', 'success', 'error');--> statement-breakpoint
CREATE TYPE "public"."legal_basis" AS ENUM('feed_consent', 'official_api', 'written_permission');--> statement-breakpoint
CREATE TYPE "public"."offer_match_status" AS ENUM('matched_ean', 'matched_fuzzy', 'matched_manual', 'unmatched');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shop_status" AS ENUM('active', 'paused');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "brands_name_unique" UNIQUE("name"),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" integer,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "feed_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"feed_id" integer NOT NULL,
	"status" "feed_run_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"offers_total" integer DEFAULT 0 NOT NULL,
	"offers_created" integer DEFAULT 0 NOT NULL,
	"offers_updated" integer DEFAULT 0 NOT NULL,
	"offers_unmatched" integer DEFAULT 0 NOT NULL,
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "feeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"url" text NOT NULL,
	"format" "feed_format" DEFAULT 'heureka_xml' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"consent_confirmed_at" timestamp with time zone,
	"consent_note" text,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer,
	"shop_id" integer NOT NULL,
	"feed_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"image_url" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" "currency" DEFAULT 'EUR' NOT NULL,
	"availability" text,
	"ean_raw" text,
	"match_status" "offer_match_status" DEFAULT 'unmatched' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"price_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"email" text NOT NULL,
	"target_price" numeric(12, 2) NOT NULL,
	"currency" "currency" DEFAULT 'EUR' NOT NULL,
	"token" text NOT NULL,
	"confirmed_at" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_alerts_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"offer_id" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" "currency" DEFAULT 'EUR' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"brand_id" integer,
	"category_id" integer,
	"ean" varchar(14),
	"mpn" text,
	"description" text,
	"image_url" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_ean_unique" UNIQUE("ean")
);
--> statement-breakpoint
CREATE TABLE "shop_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"email" text NOT NULL,
	"rating" integer NOT NULL,
	"text" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"website_url" text NOT NULL,
	"country" "country_code" DEFAULT 'sk' NOT NULL,
	"status" "shop_status" DEFAULT 'active' NOT NULL,
	"legal_basis" "legal_basis" NOT NULL,
	"contact_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_runs" ADD CONSTRAINT "feed_runs_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feeds" ADD CONSTRAINT "feeds_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_feed_id_feeds_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_alerts" ADD CONSTRAINT "price_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feed_runs_feed_id_idx" ON "feed_runs" USING btree ("feed_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "offers_feed_external_idx" ON "offers" USING btree ("feed_id","external_id");--> statement-breakpoint
CREATE INDEX "offers_product_id_idx" ON "offers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "offers_shop_id_idx" ON "offers" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "offers_match_status_idx" ON "offers" USING btree ("match_status");--> statement-breakpoint
CREATE INDEX "price_alerts_product_idx" ON "price_alerts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "price_history_offer_idx" ON "price_history" USING btree ("offer_id","recorded_at");--> statement-breakpoint
CREATE INDEX "products_brand_id_idx" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "shop_reviews_shop_idx" ON "shop_reviews" USING btree ("shop_id");