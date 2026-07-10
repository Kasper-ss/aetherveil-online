import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getMiniAppUrl, sendMessage } from './telegram.js'

const REFERRAL_SIGNUP_GOLD = 30_000
const REFERRAL_SIGNUP_GEMS = 10
const REFERRAL_MILESTONE_THRESHOLD = 100_000
const REFERRAL_MILESTONE_GOLD = 1_000

function referralCodeToTelegramId(code: string): number | null {
  if (!code.startsWith('AV')) return null
  const id = parseInt(code.slice(2), 36)
  return Number.isFinite(id) && id > 0 ? id : null
}

export interface ReferralRecord {
  referee_id: number
  referrer_id: number
  referrer_code: string
  referee_name: string
  signup_rewarded: boolean
  lifetime_gold_earned: number
  milestone_count: number
  activated: boolean
  created_at: string
}

export interface ReferralRewardRecord {
  id: string
  referrer_id: number
  reward_type: 'signup' | 'milestone'
  gold: number
  gems: number
  item_template_id: string | null
  referee_name: string
  milestone_index: number | null
  settled: boolean
  created_at: string
}

export interface ReferralInviteDto {
  refereeId: number
  displayName: string
  joinedAt: string
  signupRewarded: boolean
  lifetimeGoldEarned: number
  milestoneCount: number
  activated: boolean
}

export interface ReferralSyncResult {
  pendingReferralGold: number
  pendingReferralGems: number
  pendingReferralItems: string[]
  referrals: ReferralInviteDto[]
}

type ReferralMap = Map<number, ReferralRecord>
type RewardMap = Map<string, ReferralRewardRecord>

const globalStore = globalThis as typeof globalThis & {
  __aetherveilReferrals?: ReferralMap
  __aetherveilReferralRewards?: RewardMap
}

function referrals(): ReferralMap {
  if (!globalStore.__aetherveilReferrals) {
    globalStore.__aetherveilReferrals = new Map()
  }
  return globalStore.__aetherveilReferrals
}

function rewards(): RewardMap {
  if (!globalStore.__aetherveilReferralRewards) {
    globalStore.__aetherveilReferralRewards = new Map()
  }
  return globalStore.__aetherveilReferralRewards
}

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key || url.includes('your-project')) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function pickReferralRareItemTemplate(): string {
  const slots = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const
  const slot = slots[Math.floor(Math.random() * slots.length)]
  const tier = 5 + Math.floor(Math.random() * 2)
  return `${slot}_t${tier}`
}

async function loadReferral(refereeId: number): Promise<ReferralRecord | null> {
  const supabase = getSupabase()
  if (supabase) {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', refereeId)
      .maybeSingle()
    if (data) return data as ReferralRecord
  }
  return referrals().get(refereeId) ?? null
}

async function saveReferral(record: ReferralRecord): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('referrals').upsert(record, { onConflict: 'referee_id' })
  }
  referrals().set(record.referee_id, record)
}

async function createReward(input: Omit<ReferralRewardRecord, 'id' | 'settled' | 'created_at'>): Promise<void> {
  const id = `ref_${input.referrer_id}_${input.reward_type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const record: ReferralRewardRecord = {
    ...input,
    id,
    settled: false,
    created_at: new Date().toISOString(),
  }
  const supabase = getSupabase()
  if (supabase) {
    await supabase.from('referral_rewards').insert({
      id: record.id,
      referrer_id: record.referrer_id,
      reward_type: record.reward_type,
      gold: record.gold,
      gems: record.gems,
      item_template_id: record.item_template_id,
      referee_name: record.referee_name,
      milestone_index: record.milestone_index,
      settled: false,
      created_at: record.created_at,
    })
  }
  rewards().set(id, record)
}

async function notifyMilestoneReward(referrerId: number, refereeName: string): Promise<void> {
  try {
    const appUrl = getMiniAppUrl()
    const replyMarkup = appUrl
      ? {
          inline_keyboard: [[{ text: '🎁 Собрать награду', web_app: { url: appUrl } }]],
        }
      : undefined

    await sendMessage({
      chat_id: referrerId,
      text: `Ваш друг ${refereeName} накопил 100К монет! Вам начислено ${REFERRAL_MILESTONE_GOLD.toLocaleString('ru-RU')} монет.`,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    })
  } catch (err) {
    console.warn('[referrals] Telegram notify failed', err)
  }
}

async function processRefereeReferral(input: {
  refereeId: number
  referredBy: string
  displayName: string
  lifetimeGoldEarned: number
  activated: boolean
}): Promise<void> {
  const referrerId = referralCodeToTelegramId(input.referredBy)
  if (!referrerId || referrerId === input.refereeId) return

  const now = new Date().toISOString()
  let record = await loadReferral(input.refereeId)
  if (!record) {
    record = {
      referee_id: input.refereeId,
      referrer_id: referrerId,
      referrer_code: input.referredBy,
      referee_name: input.displayName,
      signup_rewarded: false,
      lifetime_gold_earned: 0,
      milestone_count: 0,
      activated: false,
      created_at: now,
    }
  }

  record.referee_name = input.displayName
  record.lifetime_gold_earned = Math.max(record.lifetime_gold_earned, input.lifetimeGoldEarned)
  if (input.activated) record.activated = true

  if (record.activated && !record.signup_rewarded) {
    await createReward({
      referrer_id: record.referrer_id,
      reward_type: 'signup',
      gold: REFERRAL_SIGNUP_GOLD,
      gems: REFERRAL_SIGNUP_GEMS,
      item_template_id: pickReferralRareItemTemplate(),
      referee_name: record.referee_name,
      milestone_index: null,
    })
    record.signup_rewarded = true
  }

  const totalMilestones = Math.floor(record.lifetime_gold_earned / REFERRAL_MILESTONE_THRESHOLD)
  while (record.milestone_count < totalMilestones) {
    record.milestone_count += 1
    await createReward({
      referrer_id: record.referrer_id,
      reward_type: 'milestone',
      gold: REFERRAL_MILESTONE_GOLD,
      gems: 0,
      item_template_id: null,
      referee_name: record.referee_name,
      milestone_index: record.milestone_count,
    })
    void notifyMilestoneReward(record.referrer_id, record.referee_name)
  }

  await saveReferral(record)
}

async function listReferralsForReferrer(referrerId: number): Promise<ReferralInviteDto[]> {
  const supabase = getSupabase()
  let rows: ReferralRecord[] = []

  if (supabase) {
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false })
    rows = (data ?? []) as ReferralRecord[]
  } else {
    rows = [...referrals().values()].filter((r) => r.referrer_id === referrerId)
  }

  return rows.map((r) => ({
    refereeId: r.referee_id,
    displayName: r.referee_name,
    joinedAt: r.created_at,
    signupRewarded: r.signup_rewarded,
    lifetimeGoldEarned: r.lifetime_gold_earned,
    milestoneCount: r.milestone_count,
    activated: r.activated,
  }))
}

async function getPendingRewards(referrerId: number): Promise<{
  gold: number
  gems: number
  items: string[]
}> {
  const supabase = getSupabase()
  let pending: ReferralRewardRecord[] = []

  if (supabase) {
    const { data } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('settled', false)
    pending = (data ?? []) as ReferralRewardRecord[]
  } else {
    pending = [...rewards().values()].filter((r) => r.referrer_id === referrerId && !r.settled)
  }

  let gold = 0
  let gems = 0
  const items: string[] = []
  for (const r of pending) {
    gold += r.gold
    gems += r.gems
    if (r.item_template_id) items.push(r.item_template_id)
  }
  return { gold, gems, items }
}

async function collectPendingRewards(referrerId: number): Promise<{
  gold: number
  gems: number
  items: string[]
}> {
  const supabase = getSupabase()
  let pending: ReferralRewardRecord[] = []

  if (supabase) {
    const { data } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', referrerId)
      .eq('settled', false)
    pending = (data ?? []) as ReferralRewardRecord[]
    if (pending.length > 0) {
      await supabase
        .from('referral_rewards')
        .update({ settled: true })
        .eq('referrer_id', referrerId)
        .eq('settled', false)
    }
  } else {
    for (const [id, reward] of rewards().entries()) {
      if (reward.referrer_id === referrerId && !reward.settled) {
        pending.push(reward)
        rewards().set(id, { ...reward, settled: true })
      }
    }
  }

  let gold = 0
  let gems = 0
  const items: string[] = []
  for (const r of pending) {
    gold += r.gold
    gems += r.gems
    if (r.item_template_id) items.push(r.item_template_id)
  }
  return { gold, gems, items }
}

export async function processReferralSync(input: {
  telegramId: number
  referredBy?: string
  displayName: string
  lifetimeGoldEarned: number
  classSelected: boolean
  tutorialCompleted: boolean
  level: number
  highestFloor: number
  claimRewards?: boolean
}): Promise<ReferralSyncResult> {
  const activated = input.classSelected && (
    input.tutorialCompleted || input.level >= 2 || input.highestFloor > 1
  )

  if (input.referredBy) {
    await processRefereeReferral({
      refereeId: input.telegramId,
      referredBy: input.referredBy,
      displayName: input.displayName,
      lifetimeGoldEarned: input.lifetimeGoldEarned,
      activated,
    })
  }

  const payout = input.claimRewards
    ? await collectPendingRewards(input.telegramId)
    : await getPendingRewards(input.telegramId)
  const referralList = await listReferralsForReferrer(input.telegramId)

  return {
    pendingReferralGold: payout.gold,
    pendingReferralGems: payout.gems,
    pendingReferralItems: payout.items,
    referrals: referralList,
  }
}
