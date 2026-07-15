-- Публичные профили игроков для просмотра из рейтинга
CREATE TABLE IF NOT EXISTS player_profiles (
  telegram_id BIGINT PRIMARY KEY,
  profile JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_updated ON player_profiles (updated_at DESC);
