import type { Player, AllocStatKey, AllocatedStats, Stats, PlayerClass } from '@/types/game'
import { getEffectiveItemStats } from '@/data/items'
import { applySetBonuses } from '@/lib/setBonuses'
import { getEffectMultForStat } from '@/lib/activeEffects'
import { getAchievementMultipliers } from '@/lib/achievementBonuses'
import { getRankMultipliers } from '@/lib/playerRank'
import { getPropertyMultipliers } from '@/lib/propertyBonuses'
import { getCityMultipliers } from '@/lib/cityBonuses'
import { getSetCombatEffects } from '@/lib/setCombatEffects'
import { getMaxCritChanceForClass, getMaxDodgeChanceForClass } from '@/lib/classCompat'
import { getGemStatValue, getSocketGemDef } from '@/data/socketGems'
import { getRacialStatPassives } from '@/lib/racialAbilities'
import { getEquipmentProfModifiers, getGlobalProfessionStatBonuses } from '@/lib/professionBonuses'
import { getNurseryStageStats } from '@/data/nursery'
import { getElementalBuffStats } from '@/data/elementalForge'

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

/** Legacy default; use getMaxCritChanceForClass for per-class caps. */
export const MAX_CRIT_CHANCE = 45
/** Legacy default dodge cap (0–1); use getMaxDodgeChanceForClass per class. */
export const MAX_DODGE_CHANCE = 0.7
/** Dodge chance = speed × DODGE_SPEED_FACTOR + stealth × DODGE_STEALTH_FACTOR */
export const DODGE_SPEED_FACTOR = 0.008
export const DODGE_STEALTH_FACTOR = 0.012

export function capCritChance(crit: number, classId?: PlayerClass): number {
  return Math.min(getMaxCritChanceForClass(classId), Math.max(0, crit))
}

export function rollCrit(critChance: number, classId?: PlayerClass): boolean {
  return Math.random() * 100 < capCritChance(critChance, classId)
}

export function getDodgeChance(
  stats: Pick<EffectiveStats, 'speed' | 'stealth'>,
  classId?: PlayerClass,
): number {
  const raw = stats.speed * DODGE_SPEED_FACTOR + stats.stealth * DODGE_STEALTH_FACTOR
  return Math.min(getMaxDodgeChanceForClass(classId), Math.max(0, raw))
}

export function formatDodgePercent(
  stats: Pick<EffectiveStats, 'speed' | 'stealth'>,
  classId?: PlayerClass,
): number {
  return Math.round(getDodgeChance(stats, classId) * 1000) / 10
}

export function rollDodge(
  stats: Pick<EffectiveStats, 'speed' | 'stealth'>,
  classId?: PlayerClass,
): boolean {
  return Math.random() < getDodgeChance(stats, classId)
}

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

/** Stat gain per allocated point (shown on hub and in stat distribution UI). */
export const ALLOC_STAT_PER_POINT = {
  atk: 2.5,
  hp: 18,
  def: 2.5,
  stealth: 1,
} as const

const EQUIP_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon', 'pet'] as const

export function getAllocatedStats(player: Player): AllocatedStats {
  return { ...EMPTY_ALLOCATED, ...player.allocatedStats }
}

export function getMaxEnergy(player: Player): number {
  const end = getAllocatedStats(player).endurance
  const prop = getPropertyMultipliers(player).maxEnergy
  const city = getCityMultipliers(player).maxEnergy
  return Math.floor((BASE_MAX_ENERGY + end * 3) * prop * city)
}

export function getEnergyRegenIntervalMs(player: Player): number {
  const end = getAllocatedStats(player).endurance
  const base = Math.max(8_000, BASE_ENERGY_REGEN_MS - end * 800)
  const setEffects = getSetCombatEffects(player)
  const propEnergy = getPropertyMultipliers(player).energyRegen
  const cityEnergy = getCityMultipliers(player).energyRegen
  return Math.max(5_000, Math.floor(base / (propEnergy * cityEnergy * setEffects.energyRegenMult)))
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
  const racial = getRacialStatPassives(player.raceId)
  const base = {
    ...player.stats,
    atk: (player.stats.atk ?? 0) + (racial.atk ?? 0),
    def: (player.stats.def ?? 0) + (racial.def ?? 0),
    crit: (player.stats.crit ?? 0) + (racial.crit ?? 0),
    speed: (player.stats.speed ?? 0) + (racial.speed ?? 0),
  }
  const totals = { atk: 0, def: 0, hp: 0, crit: 0, speed: 0, stealth: 0 }

  for (const slot of EQUIP_SLOTS) {
    const item = player.equipped[slot]
    if (!item) continue
    const s = getEffectiveItemStats(item)
    const prof = getEquipmentProfModifiers(player, slot)
    totals.atk += Math.floor((s.atk ?? 0) * prof.mult.atk) + prof.flat.atk
    totals.def += Math.floor((s.def ?? 0) * prof.mult.def) + prof.flat.def
    totals.hp += Math.floor((s.hp ?? 0) * prof.mult.hp) + prof.flat.hp
    totals.crit += Math.floor((s.crit ?? 0) * prof.mult.crit) + prof.flat.crit
    totals.speed += Math.floor((s.speed ?? 0) * prof.mult.speed) + prof.flat.speed
    totals.stealth += Math.floor((s.stealth ?? 0) * prof.mult.stealth) + prof.flat.stealth
    if (slot === 'pet' && player.nurseryState) {
      const nursery = getNurseryStageStats(player.nurseryState.stage)
      totals.atk += nursery.atk ?? 0
      totals.def += nursery.def ?? 0
      totals.hp += nursery.hp ?? 0
      totals.crit += nursery.crit ?? 0
      totals.speed += nursery.speed ?? 0
    }
    if (slot === 'weapon' && item.elementalBuffs?.length) {
      for (const buff of item.elementalBuffs) {
        const eb = getElementalBuffStats(buff.id, buff.level)
        totals.atk += eb.atk ?? 0
        totals.def += eb.def ?? 0
        totals.hp += eb.hp ?? 0
        totals.crit += eb.crit ?? 0
        totals.speed += eb.speed ?? 0
      }
    }
    for (const gemId of item.socketedGems ?? []) {
      const level = player.socketGemLevels?.[gemId] ?? 1
      const val = getGemStatValue(gemId, level)
      const stat = getSocketGemDef(gemId).stat
      if (stat === 'atk') totals.atk += val
      else if (stat === 'def') totals.def += val
      else if (stat === 'hp') totals.hp += val
      else if (stat === 'crit') totals.crit += val
    }
  }

  const globalProf = getGlobalProfessionStatBonuses(player)
  totals.crit += globalProf.crit
  totals.atk += globalProf.atk

  const effectMult = (stat: import('@/types/game').EffectStat) =>
    getEffectMultForStat(player, stat) * getEffectMultForStat(player, 'all')

  const achMult = getAchievementMultipliers(player).allStats
  const rankMult = getRankMultipliers(player).allStats
  const propMult = getPropertyMultipliers(player).allStats
  const cityAtk = getCityMultipliers(player).atk
  const cityDef = getCityMultipliers(player).def

  const withSets = applySetBonuses(player, {
    atk: Math.floor((base.atk + totals.atk + alloc.atk * ALLOC_STAT_PER_POINT.atk) * getDeathDebuffMult(player) * effectMult('atk') * achMult * rankMult * propMult * cityAtk),
    def: Math.floor((base.def + totals.def + alloc.def * ALLOC_STAT_PER_POINT.def) * getDeathDebuffMult(player) * effectMult('def') * achMult * rankMult * propMult * getPropertyMultipliers(player).def * cityDef),
    hp: Math.floor((base.hp + totals.hp + alloc.hp * ALLOC_STAT_PER_POINT.hp) * getDeathDebuffMult(player) * effectMult('hp') * achMult * rankMult * propMult),
    crit: Math.floor((base.crit + totals.crit + Math.floor(alloc.stealth * 0.5)) * getDeathDebuffMult(player) * effectMult('crit') * achMult * rankMult * propMult),
    speed: Math.floor((base.speed + totals.speed + alloc.stealth) * getDeathDebuffMult(player) * effectMult('speed') * achMult * rankMult * propMult),
    stealth: alloc.stealth + totals.stealth,
    endurance: alloc.endurance,
  })
  return { ...withSets, crit: capCritChance(withSets.crit, player.classId) }
}
