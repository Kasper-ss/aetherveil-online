import type { Player } from '@/types/game'

export interface AchievementBonuses {
  expPct: number
  goldPct: number
  lootPct: number
  allStatsPct: number
}

export const EMPTY_ACHIEVEMENT_BONUSES: AchievementBonuses = {
  expPct: 0,
  goldPct: 0,
  lootPct: 0,
  allStatsPct: 0,
}

export function getAchievementMultipliers(player: Player): {
  exp: number
  gold: number
  loot: number
  allStats: number
} {
  const b = { ...EMPTY_ACHIEVEMENT_BONUSES, ...player.achievementBonuses }
  return {
    exp: 1 + b.expPct,
    gold: 1 + b.goldPct,
    loot: 1 + b.lootPct,
    allStats: 1 + b.allStatsPct,
  }
}
