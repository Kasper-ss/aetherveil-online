-- Публичные данные игроков для рейтинга и рынка
CREATE TABLE IF NOT EXISTS public_players (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  level INT NOT NULL DEFAULT 1,
  highest_floor INT NOT NULL DEFAULT 1,
  guild_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_listings (
  id TEXT PRIMARY KEY,
  seller_id BIGINT NOT NULL,
  seller_name TEXT NOT NULL DEFAULT '',
  listing JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_players_floor ON public_players (highest_floor DESC, level DESC);
CREATE INDEX IF NOT EXISTS idx_market_listings_seller ON market_listings (seller_id);

CREATE TABLE IF NOT EXISTS market_sales (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  seller_id BIGINT NOT NULL,
  buyer_id BIGINT NOT NULL,
  gold_amount INT NOT NULL,
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_sales_seller ON market_sales (seller_id, settled);
