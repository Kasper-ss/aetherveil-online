-- Состояние уведомлений о восстановлении HP/энергии в Telegram-боте

CREATE TABLE IF NOT EXISTS vital_notify_state (
  telegram_id BIGINT PRIMARY KEY,
  hp_notified_full BOOLEAN NOT NULL DEFAULT false,
  energy_notified_full BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
