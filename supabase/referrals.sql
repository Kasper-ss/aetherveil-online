-- Реферальная система: связь приглашённых и награды пригласившим

CREATE TABLE IF NOT EXISTS referrals (
  referee_id BIGINT PRIMARY KEY,
  referrer_id BIGINT NOT NULL,
  referrer_code TEXT NOT NULL,
  referee_name TEXT NOT NULL DEFAULT '',
  signup_rewarded BOOLEAN NOT NULL DEFAULT false,
  lifetime_gold_earned BIGINT NOT NULL DEFAULT 0,
  milestone_count INT NOT NULL DEFAULT 0,
  activated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY,
  referrer_id BIGINT NOT NULL,
  reward_type TEXT NOT NULL,
  gold INT NOT NULL DEFAULT 0,
  gems INT NOT NULL DEFAULT 0,
  item_template_id TEXT,
  referee_name TEXT NOT NULL DEFAULT '',
  milestone_index INT,
  settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards (referrer_id, settled);
