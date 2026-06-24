-- Выполните в Supabase SQL Editor, если таблица ещё не создана:
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
