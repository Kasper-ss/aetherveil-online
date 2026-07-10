-- Telegram notification dedupe for world boss schedule (every 3 days)
create table if not exists world_boss_notify_state (
  telegram_id bigint primary key,
  sent_keys jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists world_boss_notify_state_updated_idx
  on world_boss_notify_state (updated_at desc);
