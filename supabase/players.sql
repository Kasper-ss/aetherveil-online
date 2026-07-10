-- Основное хранилище прогресса игроков (выполнить в Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS players (
  telegram_id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  floor INT NOT NULL DEFAULT 1,
  level INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_floor ON leaderboard (floor DESC, level DESC);

-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- Добавьте RLS-политики под вашу схему авторизации
