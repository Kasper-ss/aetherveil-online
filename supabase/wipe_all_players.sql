-- Global progress wipe (run once in Supabase SQL editor)
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE public_players CASCADE;
TRUNCATE TABLE market_listings CASCADE;
TRUNCATE TABLE market_sales CASCADE;
TRUNCATE TABLE property_ownership CASCADE;
TRUNCATE TABLE stock_market_state CASCADE;
TRUNCATE TABLE referrals CASCADE;
TRUNCATE TABLE referral_rewards CASCADE;
