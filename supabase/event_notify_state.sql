-- Дедупликация уведомлений о игровых событиях
CREATE TABLE IF NOT EXISTS event_notify_state (
  telegram_id BIGINT PRIMARY KEY,
  sent_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
