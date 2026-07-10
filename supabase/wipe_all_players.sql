-- Полный сброс прогресса (Supabase SQL Editor)
-- 1) Сначала убедитесь, что таблицы созданы:
--    supabase/players.sql
--    supabase/multiplayer.sql
--    supabase/referrals.sql
--    supabase/market_sales.sql
--    supabase/vital_notifications.sql
--    supabase/star_payments.sql
--
-- 2) Затем выполните этот файл.

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

DO $$
BEGIN
  IF to_regclass('public.players') IS NOT NULL THEN
    TRUNCATE TABLE players;
  END IF;
  IF to_regclass('public.leaderboard') IS NOT NULL THEN
    TRUNCATE TABLE leaderboard;
  END IF;
  IF to_regclass('public.public_players') IS NOT NULL THEN
    TRUNCATE TABLE public_players;
  END IF;
  IF to_regclass('public.market_listings') IS NOT NULL THEN
    TRUNCATE TABLE market_listings;
  END IF;
  IF to_regclass('public.market_sales') IS NOT NULL THEN
    TRUNCATE TABLE market_sales;
  END IF;
  IF to_regclass('public.property_ownership') IS NOT NULL THEN
    TRUNCATE TABLE property_ownership;
  END IF;
  IF to_regclass('public.stock_market_state') IS NOT NULL THEN
    TRUNCATE TABLE stock_market_state;
  END IF;
  IF to_regclass('public.referrals') IS NOT NULL THEN
    TRUNCATE TABLE referrals;
  END IF;
  IF to_regclass('public.referral_rewards') IS NOT NULL THEN
    TRUNCATE TABLE referral_rewards;
  END IF;
  IF to_regclass('public.vital_notify_state') IS NOT NULL THEN
    TRUNCATE TABLE vital_notify_state;
  END IF;
  IF to_regclass('public.star_payments') IS NOT NULL THEN
    TRUNCATE TABLE star_payments;
  END IF;
END $$;
