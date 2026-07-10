import { getRecommendedLevelForFloor } from '@/lib/combatScaling'

/** WoW-style reward tuning: less XP/gold when overleveled for the floor. */
export function getCombatRewardEase(playerLevel: number, floor: number): { expMult: number; goldMult: number } {
  const recLevel = getRecommendedLevelForFloor(floor)
  const gap = playerLevel - recLevel

  if (gap > 10) {
    const penalty = Math.min(0.65, 0.25 + (gap - 10) * 0.06)
    return { expMult: 1 - penalty, goldMult: 1 - penalty * 0.45 }
  }
  if (gap > 5) {
    const penalty = (gap - 5) * 0.05
    return { expMult: 1 - penalty, goldMult: 1 - penalty * 0.4 }
  }
  if (gap < -4) {
    return { expMult: 1.08, goldMult: 1.05 }
  }
  return { expMult: 1, goldMult: 1 }
}

export function applyCombatRewardEase(
  exp: number,
  gold: number,
  playerLevel: number,
  floor: number,
): { exp: number; gold: number } {
  const ease = getCombatRewardEase(playerLevel, floor)
  return {
    exp: Math.max(1, Math.floor(exp * ease.expMult)),
    gold: Math.max(0, Math.floor(gold * ease.goldMult)),
  }
}
