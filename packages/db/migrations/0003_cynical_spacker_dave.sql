CREATE TABLE "product_price_daily" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"day" date NOT NULL,
	"currency" "currency" DEFAULT 'EUR' NOT NULL,
	"min_price" numeric(12, 2) NOT NULL,
	"avg_price" numeric(12, 2) NOT NULL,
	"offer_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_price_daily" ADD CONSTRAINT "product_price_daily_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_price_daily_unique" ON "product_price_daily" USING btree ("product_id","day","currency");--> statement-breakpoint
CREATE INDEX "product_price_daily_day_idx" ON "product_price_daily" USING btree ("day");