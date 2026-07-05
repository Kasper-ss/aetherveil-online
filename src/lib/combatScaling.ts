import type { FloorEnemy, Item, ItemRarity, Player } from '@/types/game'
import { getEffectiveStats, getCombatMaxHp } from '@/lib/playerStats'
import { getUpgradeLevelStatBonus, getStarStatBonus } from '@/data/items'

const RARITY_POWER: Record<ItemRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.45,
  legendary: 1.8,
  mythic: 2.25,
}

const GEAR_SLOTS = ['helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon'] as const

function gearItemPower(item: Item): number {
  const rarityMult = RARITY_POWER[item.rarity] ?? 1
  const upgradeMult = 1 + getUpgradeLevelStatBonus(item.upgradeLevel ?? 1)
  const starMult = 1 + getStarStatBonus(item.starLevel ?? 0)
  return rarityMult * upgradeMult * starMult
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

/** Baseline power expected for a floor (average progression, basic gear). */
export function getFloorBenchmarkPower(floor: number): number {
  const f = Math.max(1, floor)
  const atk = 12 + f * 14
  const def = 6 + f * 7
  const hp = 100 + f * 55
  const level = Math.max(1, Math.floor((f - 1) * 2 + 4))
  const gear = 1 + Math.min(0.55, f * 0.022)
  const statScore = atk * 1.35 + def * 1.1 + (hp + level * 20) * 0.06 + level * 12
  return statScore * gear
}

export function getPlayerCombatPower(player: Player): number {
  return getStatPowerScore(player) * getGearPowerScore(player)
}

export interface CombatEaseResult {
  playerDamageMult: number
  enemyPowerMult: number
  /** How much stronger than floor benchmark (0 = on par, 0.5 = 50% stronger). */
  powerAdvantage: number
  playerPower: number
  benchmarkPower: number
}

/**
 * Dynamic difficulty: stronger stats + better gear (rarity, level, stars)
 * make mobs and bosses easier on the current floor.
 */
export function getPlayerCombatEase(player: Player, floor: number): CombatEaseResult {
  const playerPower = getPlayerCombatPower(player)
  const benchmark = getFloorBenchmarkPower(floor)
  const ratio = benchmark > 0 ? playerPower / benchmark : 1
  const powerAdvantage = Math.max(0, ratio - 1)

  const playerDamageMult = 1 + Math.min(1, powerAdvantage * 0.5)
  const enemyPowerMult = Math.max(0.3, 1 - Math.min(0.7, powerAdvantage * 0.4))

  return {
    playerDamageMult,
    enemyPowerMult,
    powerAdvantage,
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
  if (enemyPowerMult >= 1) return enemy
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
  const { powerAdvantage, enemyPowerMult } = getPlayerCombatEase(player, floor)
  if (powerAdvantage < 0.08) return null
  const weakenPct = Math.round((1 - enemyPowerMult) * 100)
  if (powerAdvantage >= 0.6) {
    return `Отличная прокачка и экипировка: враги слабее на ~${weakenPct}%`
  }
  if (powerAdvantage >= 0.3) {
    return `Сильный билд: враги слабее на ~${weakenPct}%`
  }
  return `Экипировка выше нормы этажа: враги слабее на ~${weakenPct}%`
}

/** @deprecated Use getFloorBenchmarkPower — kept for display helpers. */
export function getRecommendedLevelForFloor(floor: number): number {
  return Math.max(1, Math.floor((floor - 1) * 2 + 4))
}
