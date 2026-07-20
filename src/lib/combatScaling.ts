import type { FloorEnemy, Item, ItemRarity, Player } from '@/types/game'
import { getEffectiveStats, getCombatMaxHp } from '@/lib/playerStats'
import { getItemPowerMultVsTemplate } from '@/data/items'

const RARITY_POWER: Record<ItemRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.45,
  legendary: 1.8,
  mythic: 2.25,
  divine: 2.75,
}

const GEAR_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon'] as const

function gearItemPower(item: Item): number {
  const rarityMult = RARITY_POWER[item.rarity] ?? 1
  return rarityMult * getItemPowerMultVsTemplate(item)
}

/** Average gear quality from rarity, upgrade level and stars. */
export function getGearPowerScore(player: Player): number {
  let sum = 0
  let count = 0
  for (const slot of GEAR_SLOTS) {
    const item = player.equipped[slot]
    if (!item) continue
    sum += gearItemPower(item)
    count++
  }
  if (count === 0) return 1
  return sum / count
}

/** Combat power from effective stats and character level. */
export function getStatPowerScore(player: Player): number {
  const stats = getEffectiveStats(player)
  const maxHp = getCombatMaxHp(player)
  return stats.atk * 1.35
    + stats.def * 1.1
    + maxHp * 0.06
    + stats.crit * 2.5
    + stats.speed * 1.8
    + player.level * 12
}

/** Baseline power expected for a floor (aligned with recommended ATK/DEF). */
export function getFloorBenchmarkPower(floor: number): number {
  const f = Math.max(1, floor)
  const atk = f * 9 + 30
  const def = f * 7 + 20
  const hp = 70 + f * 40
  const level = Math.max(1, Math.floor((f - 1) * 2 + 4))
  const gear = 1 + Math.min(0.4, f * 0.018)
  const statScore = atk * 1.35 + def * 1.1 + (hp + level * 20) * 0.06 + level * 12
  return statScore * gear * 1.02
}

export function getPlayerCombatPower(player: Player): number {
  return getStatPowerScore(player) * getGearPowerScore(player)
}

export interface CombatEaseResult {
  playerDamageMult: number
  enemyPowerMult: number
  /** How much stronger than floor benchmark (0 = on par). */
  powerAdvantage: number
  /** How much weaker than floor benchmark (0 = on par). */
  powerDisadvantage: number
  playerPower: number
  benchmarkPower: number
}

/**
 * Dynamic difficulty: stats + gear vs floor benchmark.
 * Undergeared players face tougher mobs; overgeared players get only modest relief.
 */
export function getPlayerCombatEase(player: Player, floor: number): CombatEaseResult {
  const playerPower = getPlayerCombatPower(player)
  const benchmark = getFloorBenchmarkPower(floor)
  const ratio = benchmark > 0 ? playerPower / benchmark : 1
  const powerAdvantage = Math.max(0, ratio - 1)
  const powerDisadvantage = Math.max(0, 1 - ratio)

  const easeDamage = Math.min(0.26, powerAdvantage * 0.13)
  const easeEnemy = Math.min(0.24, powerAdvantage * 0.12)
  const penaltyDamage = Math.min(0.16, powerDisadvantage * 0.22)
  const penaltyEnemy = Math.min(0.18, powerDisadvantage * 0.24)

  const playerDamageMult = Math.max(0.82, 1 + easeDamage - penaltyDamage)
  const enemyPowerMult = Math.min(1.18, Math.max(0.72, 1 - easeEnemy + penaltyEnemy))

  return {
    playerDamageMult,
    enemyPowerMult,
    powerAdvantage,
    powerDisadvantage,
    playerPower,
    benchmarkPower: benchmark,
  }
}

export function scaleEnemyForPlayerPower(
  enemy: FloorEnemy,
  player: Player,
  floor: number,
): FloorEnemy {
  const { enemyPowerMult } = getPlayerCombatEase(player, floor)
  if (Math.abs(enemyPowerMult - 1) < 0.005) return enemy
  return {
    ...enemy,
    stats: {
      ...enemy.stats,
      hp: Math.max(1, Math.floor(enemy.stats.hp * enemyPowerMult)),
      atk: Math.max(1, Math.floor(enemy.stats.atk * enemyPowerMult)),
      def: Math.max(1, Math.floor(enemy.stats.def * enemyPowerMult)),
    },
  }
}

export function formatCombatEaseHint(player: Player, floor: number): string | null {
  const { powerAdvantage, powerDisadvantage, enemyPowerMult } = getPlayerCombatEase(player, floor)
  if (powerDisadvantage >= 0.12) {
    const boostPct = Math.round((enemyPowerMult - 1) * 100)
    if (powerDisadvantage >= 0.35) {
      return `Слабая прокачка для этажа: враги сильнее на ~${boostPct}%`
    }
    return `Этаж тяжёлый для вашего билда: враги сильнее на ~${boostPct}%`
  }
  if (powerAdvantage < 0.2) return null
  const weakenPct = Math.round((1 - enemyPowerMult) * 100)
  if (weakenPct <= 2) return null
  if (powerAdvantage >= 0.55) {
    return `Отличная экипировка: враги слабее на ~${weakenPct}%`
  }
  return `Хороший билд: враги слабее на ~${weakenPct}%`
}

/** @deprecated Use getFloorBenchmarkPower — kept for display helpers. */
export function getRecommendedLevelForFloor(floor: number): number {
  return Math.max(1, Math.floor((floor - 1) * 2 + 4))
}

export interface FloorStatRequirements {
  minAtk: number
  minDef: number
  recommendedAtk: number
  recommendedDef: number
}

/** Minimum and recommended ATK/DEF for comfortable floor progression. */
export function getFloorStatRequirements(floor: number): FloorStatRequirements {
  const f = Math.max(1, floor)
  return {
    minAtk: f * 6 + 18,
    minDef: f * 5 + 12,
    recommendedAtk: f * 9 + 30,
    recommendedDef: f * 7 + 20,
  }
}
