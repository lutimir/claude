-- Trigram index nad normalizovaným názvom produktu pre fuzzy párovanie
CREATE INDEX IF NOT EXISTS products_name_unaccent_trgm_idx
  ON products USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);
