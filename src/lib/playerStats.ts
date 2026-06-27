import type { Player, AllocStatKey, AllocatedStats, Stats } from '@/types/game'
import { getEffectiveItemStats } from '@/data/items'
import { applySetBonuses } from '@/lib/setBonuses'
import { getEffectMultForStat } from '@/lib/activeEffects'
import { getAchievementMultipliers } from '@/lib/achievementBonuses'

export function hasDeathDebuff(player: Player): boolean {
  if (!player.deathDebuffUntil) return false
  return new Date(player.deathDebuffUntil).getTime() > Date.now()
}

export function getDeathDebuffMult(player: Player): number {
  return hasDeathDebuff(player) ? 0.7 : 1
}

export type EffectiveStats = Stats & { stealth: number; endurance: number }

export const BASE_MAX_ENERGY = 100
export const BASE_ENERGY_REGEN_MS = 30_000
export const BASE_HP_REGEN_MS = 60_000

export const ALLOC_STAT_LABELS: Record<AllocStatKey, string> = {
  atk: 'Атака',
  hp: 'Здоровье',
  def: 'Защита',
  stealth: 'Скрытность',
  endurance: 'Выносливость',
}

export const EMPTY_ALLOCATED: AllocatedStats = {
  atk: 0, hp: 0, def: 0, stealth: 0, endurance: 0,
}

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export function getAllocatedStats(player: Player): AllocatedStats {
  return { ...EMPTY_ALLOCATED, ...player.allocatedStats }
}

export function getMaxEnergy(player: Player): number {
  const end = getAllocatedStats(player).endurance
  return BASE_MAX_ENERGY + end * 3
}

export function getEnergyRegenIntervalMs(player: Player): number {
  const end = getAllocatedStats(player).endurance
  return Math.max(8_000, BASE_ENERGY_REGEN_MS - end * 800)
}

export function getHpRegenIntervalMs(player: Player): number {
  const max = getCombatMaxHp(player)
  const end = getAllocatedStats(player).endurance
  const targetFullHealMs = 3_600_000
  const baseInterval = max > 1 ? Math.floor(targetFullHealMs / (max - 1)) : targetFullHealMs
  const enduranceBonus = Math.min(0.3, end * 0.025)
  return Math.max(2_000, Math.floor(baseInterval * (1 - enduranceBonus)))
}

export function getCombatMaxHp(player: Player): number {
  const stats = getEffectiveStats(player)
  return stats.hp + player.level * 20
}

export function getPlayerCurrentHp(player: Player): number {
  const max = getCombatMaxHp(player)
  if (player.currentHp == null) return max
  return Math.min(max, Math.max(0, player.currentHp))
}

export function getHpFullInMs(player: Player): number {
  const max = getCombatMaxHp(player)
  const current = getPlayerCurrentHp(player)
  if (current >= max) return 0
  const missing = max - current
  const interval = getHpRegenIntervalMs(player)
  const last = new Date(player.hpLastRegenAt ?? Date.now()).getTime()
  const untilNext = Math.max(0, interval - ((Date.now() - last) % interval))
  return untilNext + (missing - 1) * interval
}

export function getEnergyFullInMs(player: Player): number {
  if (player.energy >= getMaxEnergy(player)) return 0
  const missing = getMaxEnergy(player) - player.energy
  return missing * getEnergyRegenIntervalMs(player)
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return 'полная'
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}м ${s}с` : `${s}с`
}

export function getEffectiveStats(player: Player): EffectiveStats {
  const alloc = getAllocatedStats(player)
  const base = { ...player.stats }
  const totals = { atk: 0, def: 0, hp: 0, crit: 0, speed: 0 }

  for (const slot of EQUIP_SLOTS) {
    const item = player.equipped[slot]
    if (!item) continue
    const s = getEffectiveItemStats(item)
    totals.atk += s.atk ?? 0
    totals.def += s.def ?? 0
    totals.hp += s.hp ?? 0
    totals.crit += s.crit ?? 0
    totals.speed += s.speed ?? 0
  }

  const effectMult = (stat: import('@/types/game').EffectStat) =>
    getEffectMultForStat(player, stat) * getEffectMultForStat(player, 'all')

  const achMult = getAchievementMultipliers(player).allStats

  return applySetBonuses(player, {
    atk: Math.floor((base.atk + totals.atk + alloc.atk * 2) * getDeathDebuffMult(player) * effectMult('atk') * achMult),
    def: Math.floor((base.def + totals.def + alloc.def * 2) * getDeathDebuffMult(player) * effectMult('def') * achMult),
    hp: Math.floor((base.hp + totals.hp + alloc.hp * 15) * getDeathDebuffMult(player) * effectMult('hp') * achMult),
    crit: Math.floor((base.crit + totals.crit + Math.floor(alloc.stealth * 0.5)) * getDeathDebuffMult(player) * effectMult('crit') * achMult),
    speed: Math.floor((base.speed + totals.speed + alloc.stealth) * getDeathDebuffMult(player) * effectMult('speed') * achMult),
    stealth: alloc.stealth,
    endurance: alloc.endurance,
  })
}
