-- Таблица платежей Telegram Stars (выполнить в Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS star_payments (
  payload TEXT PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  product_id TEXT NOT NULL,
  stars INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  charge_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS star_payments_telegram_id_idx ON star_payments (telegram_id);
CREATE INDEX IF NOT EXISTS star_payments_status_idx ON star_payments (status);
