import type { Stats } from '@/types/game'

export const NURSERY_MAX_STAGE = 5

/** Feed points required to advance from stage N to N+1. */
export const NURSERY_FEED_REQUIRED: Record<number, number> = {
  1: 18,
  2: 40,
  3: 75,
  4: 150,
  5: 0,
}

/** Gold + meat cost per feed action (scales with stage). */
export function getNurseryFeedCost(stage: number): { gold: number; meat: number; herb: number } {
  return {
    gold: 80 + stage * 120,
    meat: 2 + Math.floor(stage / 2),
    herb: stage >= 3 ? 2 : stage >= 2 ? 1 : 0,
  }
}

/** Bonus stats applied to equipped pet (and shown in nursery). */
export function getNurseryStageStats(stage: number): Partial<Stats> {
  const s = Math.max(1, Math.min(NURSERY_MAX_STAGE, stage))
  return {
    atk: 4 + s * 8,
    def: 3 + s * 6,
    hp: 15 + s * 25,
    crit: s * 2,
    speed: s,
  }
}

export const NURSERY_STAGE_LABELS: Record<number, string> = {
  1: 'Малыш',
  2: 'Подросток',
  3: 'Взрослый',
  4: 'Могучий',
  5: 'Легенда',
}
