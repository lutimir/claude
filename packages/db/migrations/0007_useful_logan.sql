ALTER TABLE "shop_reviews" ADD COLUMN "token" text;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_token_unique" UNIQUE("token");