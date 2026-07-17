-- Fulltext vyhľadávanie bez diakritiky + trigram podpora pre fuzzy párovanie (fáza 4)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- unaccent() nie je IMMUTABLE, preto wrapper — potrebný pre funkčné indexy
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
RETURN unaccent('unaccent', $1);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_name_fts_idx
  ON products USING gin (to_tsvector('simple', immutable_unaccent(name)));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING gin (name gin_trgm_ops);
