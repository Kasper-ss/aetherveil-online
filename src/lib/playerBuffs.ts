import type { Player } from '@/types/game'
import { getLuckyMultipliers } from '@/lib/luckyBonuses'
import { getAchievementMultipliers } from '@/lib/achievementBonuses'
import { FATE_EXP_MULTIPLIER, FATE_GOLD_MULTIPLIER } from '@/lib/fateCards'

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
  return buff * fate * getLuckyMultipliers(player).exp * ach
}

export function getGoldMultiplier(player: Player): number {
  const buff = isBuffActive(player.buffTripleGoldUntil) ? 3 : 1
  const fate = isBuffActive(player.buffFateGoldUntil) ? FATE_GOLD_MULTIPLIER : 1
  const ach = getAchievementMultipliers(player).gold
  return buff * fate * getLuckyMultipliers(player).gold * ach
}

export function getLootMultiplier(player: Player): number {
  return getLuckyMultipliers(player).loot * getAchievementMultipliers(player).loot
}

export function getDailyBonusExtra(player: Player): { gold: number; gems: number } {
  if (!isBuffActive(player.buffDailyBonusUntil)) return { gold: 0, gems: 0 }
  return { gold: 50, gems: 5 }
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
