import type { Player } from '@/types/game'
import { getLuckyMultipliers } from '@/lib/luckyBonuses'
import { getAchievementMultipliers } from '@/lib/achievementBonuses'
import { getPropertyMultipliers } from '@/lib/propertyBonuses'
import { getCityMultipliers } from '@/lib/cityBonuses'
import { getVipMultipliers } from '@/lib/vipBonuses'
import { FATE_EXP_MULTIPLIER, FATE_GOLD_MULTIPLIER } from '@/lib/fateCards'

import { getActiveEventGoldMult, getActiveEventLootMult } from '@shared/eventsSchedule'

export function isBuffActive(until?: string): boolean {
  if (!until) return false
  return new Date(until).getTime() > Date.now()
}

export function extendBuff(currentUntil: string | undefined, durationMs: number): string {
  const now = Date.now()
  const base = currentUntil && new Date(currentUntil).getTime() > now
    ? new Date(currentUntil).getTime()
    : now
  return new Date(base + durationMs).toISOString()
}

export function hasInfiniteEnergy(player: Player): boolean {
  return isBuffActive(player.buffInfiniteEnergyUntil)
}

export function getExpMultiplier(player: Player): number {
  const buff = isBuffActive(player.buffDoubleExpUntil) ? 2 : 1
  const fate = isBuffActive(player.buffFateExpUntil) ? FATE_EXP_MULTIPLIER : 1
  const ach = getAchievementMultipliers(player).exp
  const prop = getPropertyMultipliers(player)
  const city = getCityMultipliers(player)
  const vip = getVipMultipliers(player)
  return buff * fate * getLuckyMultipliers(player).exp * ach * prop.exp * prop.allRewards * city.exp * city.allRewards * vip.exp
}

export function getGoldMultiplier(player: Player): number {
  const buff = isBuffActive(player.buffTripleGoldUntil) ? 3 : 1
  const fate = isBuffActive(player.buffFateGoldUntil) ? FATE_GOLD_MULTIPLIER : 1
  const promo = isBuffActive(player.buffPromoGoldUntil) ? (player.buffPromoGoldMult ?? 1) : 1
  const ach = getAchievementMultipliers(player).gold
  const prop = getPropertyMultipliers(player)
  const city = getCityMultipliers(player)
  const vip = getVipMultipliers(player)
  return buff * fate * promo * getLuckyMultipliers(player).gold * ach * prop.mobGold * prop.allRewards * city.mobGold * city.allRewards * vip.gold * getActiveEventGoldMult()
}

export function getLootMultiplier(player: Player, isBoss = false): number {
  const prop = getPropertyMultipliers(player)
  const city = getCityMultipliers(player)
  const vip = getVipMultipliers(player)
  return getLuckyMultipliers(player).loot * getAchievementMultipliers(player).loot * prop.rareLoot * prop.allRewards * city.rareLoot * city.allRewards * vip.loot * getActiveEventLootMult(isBoss)
}

export function getGatherResourceMultiplier(player: Player): number {
  const city = getCityMultipliers(player)
  return getPropertyMultipliers(player).gatherResources * city.gatherResources
}

export function getCraftSuccessMultiplier(player: Player): number {
  const city = getCityMultipliers(player)
  return getPropertyMultipliers(player).craftSuccess * city.craftSuccess
}

/** Chance-based duplicate resources from city/property gather bonus. */
export function rollExtraGatherResources(
  player: Player,
  resources: Partial<Record<import('@/types/game').ResourceId, number>>,
): Partial<Record<import('@/types/game').ResourceId, number>> {
  const mult = getGatherResourceMultiplier(player)
  if (mult <= 1) return {}
  const extra: Partial<Record<import('@/types/game').ResourceId, number>> = {}
  for (const [resId, amount] of Object.entries(resources)) {
    if (amount && Math.random() < mult - 1) {
      extra[resId as import('@/types/game').ResourceId] = amount
    }
  }
  return extra
}

/** Extra potion/craft output roll from alchemy lab and property bonuses. */
export function rollCraftBonusExtra(player: Player): boolean {
  const mult = getCraftSuccessMultiplier(player)
  if (mult <= 1) return false
  return Math.random() < Math.min(0.5, mult - 1)
}

export function getDailyBonusExtra(player: Player): { gold: number; gems: number } {
  if (!isBuffActive(player.buffDailyBonusUntil)) return { gold: 0, gems: 0 }
  return { gold: 50, gems: 5 }
}

export function getBoostedExp(amount: number, player: Player): number {
  return Math.floor(amount * getExpMultiplier(player))
}

export function getBoostedGold(amount: number, player: Player): number {
  return Math.floor(amount * getGoldMultiplier(player))
}

export function hasRewardBoost(player: Player): boolean {
  return getExpMultiplier(player) > 1.001 || getGoldMultiplier(player) > 1.001
}

export interface ActiveBuffInfo {
  id: string
  label: string
  until: string
}

export function getActiveBuffs(player: Player): ActiveBuffInfo[] {
  const buffs: ActiveBuffInfo[] = []
  if (isBuffActive(player.buffInfiniteEnergyUntil)) {
    buffs.push({ id: 'energy', label: 'Бесконечная энергия', until: player.buffInfiniteEnergyUntil! })
  }
  if (isBuffActive(player.buffDoubleExpUntil)) {
    buffs.push({ id: 'exp', label: 'Двойной EXP', until: player.buffDoubleExpUntil! })
  }
  if (isBuffActive(player.buffTripleGoldUntil)) {
    buffs.push({ id: 'gold', label: 'Тройной Gold', until: player.buffTripleGoldUntil! })
  }
  if (isBuffActive(player.buffDailyBonusUntil)) {
    buffs.push({ id: 'daily', label: '+50 к ежедневным наградам', until: player.buffDailyBonusUntil! })
  }
  if (isBuffActive(player.buffFateGoldUntil)) {
    buffs.push({ id: 'fateGold', label: 'Карта: золото', until: player.buffFateGoldUntil! })
  }
  if (isBuffActive(player.buffFateExpUntil)) {
    buffs.push({ id: 'fateExp', label: 'Карта: опыт', until: player.buffFateExpUntil! })
  }
  if (isBuffActive(player.buffPromoGoldUntil)) {
    const pct = Math.round(((player.buffPromoGoldMult ?? 1) - 1) * 100)
    buffs.push({ id: 'promoGold', label: `Промокод: +${pct}% Gold`, until: player.buffPromoGoldUntil! })
  }
  return buffs
}

export function formatBuffRemaining(until: string): string {
  const ms = new Date(until).getTime() - Date.now()
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)} дн. ${h % 24} ч.`
  if (h > 0) return `${h} ч. ${m} мин.`
  return `${m} мин.`
}
