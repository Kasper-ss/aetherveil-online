import type { ResourceId } from '@/types/game'
import { getGrindLocationXpToUnlock } from '@/lib/professionProgress'

export interface HerbFieldLevel {
  level: number
  nameRu: string
  primaryHerb: ResourceId
  energyCost: number
  xpPerGather: number
  xpToUnlock: number
  amount: [number, number]
  bonusChance: number
}

export const HERB_FIELD_LEVELS: HerbFieldLevel[] = [
  {
    level: 1,
    nameRu: 'Луговая поляна',
    primaryHerb: 'herb_mint',
    energyCost: 14,
    xpPerGather: 3,
    xpToUnlock: 0,
    amount: [2, 4],
    bonusChance: 0.06,
  },
  {
    level: 2,
    nameRu: 'Целебный склон',
    primaryHerb: 'herb',
    energyCost: 18,
    xpPerGather: 4,
    xpToUnlock: 280,
    amount: [2, 3],
    bonusChance: 0.08,
  },
  {
    level: 3,
    nameRu: 'Болотный лотос',
    primaryHerb: 'herb_lotus',
    energyCost: 22,
    xpPerGather: 5,
    xpToUnlock: 700,
    amount: [1, 3],
    bonusChance: 0.1,
  },
  {
    level: 4,
    nameRu: 'Вершины Феникса',
    primaryHerb: 'herb_phoenix',
    energyCost: 26,
    xpPerGather: 6,
    xpToUnlock: 1600,
    amount: [1, 2],
    bonusChance: 0.12,
  },
  {
    level: 5,
    nameRu: 'Эфирная поляна',
    primaryHerb: 'herb_void',
    energyCost: 32,
    xpPerGather: 7,
    xpToUnlock: 3200,
    amount: [1, 2],
    bonusChance: 0.14,
  },
]

export function getHerbFieldLevelData(level: number): HerbFieldLevel {
  return HERB_FIELD_LEVELS.find((h) => h.level === level) ?? HERB_FIELD_LEVELS[0]
}

export function getUnlockedHerbFieldLevel(xp: number): number {
  let unlocked = 1
  for (const h of HERB_FIELD_LEVELS) {
    if (xp >= getGrindLocationXpToUnlock(h.level)) unlocked = h.level
  }
  return unlocked
}

export function rollHerbGather(level: HerbFieldLevel): {
  resources: Partial<Record<ResourceId, number>>
  isBonus: boolean
} {
  const amount = level.amount[0] + Math.floor(Math.random() * (level.amount[1] - level.amount[0] + 1))
  const isBonus = Math.random() < level.bonusChance
  const total = isBonus ? amount * 2 : amount
  return {
    resources: { [level.primaryHerb]: total },
    isBonus,
  }
}
