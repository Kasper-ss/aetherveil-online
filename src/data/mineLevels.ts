import type { ResourceId } from '@/types/game'
import { rollJewelLoot } from '@/lib/jewelResources'
import { getGrindLocationXpToUnlock } from '@/lib/professionProgress'

export interface MineLevel {
  level: number
  nameRu: string
  primaryResource: ResourceId
  energyCost: number
  xpPerDig: number
  xpToUnlock: number
  drops: { resource: ResourceId; weight: number; amount: [number, number] }[]
  doubleChance: number
  veinChance: number
}

export const MINE_LEVELS: MineLevel[] = [
  {
    level: 1,
    nameRu: 'Каменоломня',
    primaryResource: 'stone_chunk',
    energyCost: 14,
    xpPerDig: 3,
    xpToUnlock: 0,
    drops: [
      { resource: 'stone_chunk', weight: 70, amount: [1, 3] },
      { resource: 'iron_ore', weight: 20, amount: [1, 2] },
      { resource: 'sulfur', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.06,
    veinChance: 0.02,
  },
  {
    level: 2,
    nameRu: 'Железная шахта',
    primaryResource: 'iron_ore',
    energyCost: 18,
    xpPerDig: 4,
    xpToUnlock: 320,
    drops: [
      { resource: 'iron_ore', weight: 55, amount: [2, 4] },
      { resource: 'stone_chunk', weight: 25, amount: [1, 2] },
      { resource: 'upgrade_core', weight: 8, amount: [1, 1] },
      { resource: 'sulfur', weight: 12, amount: [1, 1] },
    ],
    doubleChance: 0.07,
    veinChance: 0.03,
  },
  {
    level: 3,
    nameRu: 'Золотой рудник',
    primaryResource: 'gold_ore',
    energyCost: 22,
    xpPerDig: 5,
    xpToUnlock: 900,
    drops: [
      { resource: 'gold_ore', weight: 40, amount: [1, 3] },
      { resource: 'iron_ore', weight: 30, amount: [1, 2] },
      { resource: 'gem_shard', weight: 15, amount: [1, 1] },
      { resource: 'rare_spice', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.08,
    veinChance: 0.04,
  },
  {
    level: 4,
    nameRu: 'Алмазная жила',
    primaryResource: 'raw_diamond',
    energyCost: 26,
    xpPerDig: 6,
    xpToUnlock: 2000,
    drops: [
      { resource: 'raw_diamond', weight: 25, amount: [1, 2] },
      { resource: 'gold_ore', weight: 35, amount: [1, 2] },
      { resource: 'gem_shard', weight: 25, amount: [1, 2] },
      { resource: 'abyssal_pearl', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.09,
    veinChance: 0.05,
  },
  {
    level: 5,
    nameRu: 'Мифриловые глубины',
    primaryResource: 'mithril_ore',
    energyCost: 30,
    xpPerDig: 7,
    xpToUnlock: 4000,
    drops: [
      { resource: 'mithril_ore', weight: 35, amount: [1, 2] },
      { resource: 'raw_diamond', weight: 25, amount: [1, 1] },
      { resource: 'aether_dust', weight: 20, amount: [1, 1] },
      { resource: 'star_shard', weight: 20, amount: [1, 1] },
    ],
    doubleChance: 0.1,
    veinChance: 0.06,
  },
  {
    level: 6,
    nameRu: 'Адамантиевый разлом',
    primaryResource: 'adamantite',
    energyCost: 36,
    xpPerDig: 8,
    xpToUnlock: 7000,
    drops: [
      { resource: 'adamantite', weight: 30, amount: [1, 2] },
      { resource: 'mithril_ore', weight: 30, amount: [1, 2] },
      { resource: 'aether_dust', weight: 25, amount: [1, 1] },
      { resource: 'star_shard', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.12,
    veinChance: 0.08,
  },
]

export function getMineLevelData(level: number): MineLevel {
  return MINE_LEVELS.find((m) => m.level === level) ?? MINE_LEVELS[0]
}

export function getUnlockedMineLevel(xp: number): number {
  let unlocked = 1
  for (const m of MINE_LEVELS) {
    if (xp >= getGrindLocationXpToUnlock(m.level)) unlocked = m.level
  }
  return unlocked
}

function rollAmount(range: [number, number]): number {
  return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))
}

export function rollMineRewards(level: MineLevel): {
  resources: Partial<Record<ResourceId, number>>
  isDouble: boolean
  isVein: boolean
} {
  const totalWeight = level.drops.reduce((s, d) => s + d.weight, 0)
  let roll = Math.random() * totalWeight
  let pick = level.drops[0]
  for (const d of level.drops) {
    roll -= d.weight
    if (roll <= 0) { pick = d; break }
  }

  const isVein = Math.random() < level.veinChance
  const isDouble = isVein || Math.random() < level.doubleChance
  let amount = rollAmount(pick.amount)
  if (isVein) amount *= 3
  else if (isDouble) amount *= 2

  const resources: Partial<Record<ResourceId, number>> = { [pick.resource]: amount }
  if (isVein) {
    const bonus = level.drops[Math.floor(Math.random() * level.drops.length)]
    resources[bonus.resource] = (resources[bonus.resource] ?? 0) + rollAmount(bonus.amount)
  }

  Object.assign(resources, rollJewelLoot(0.03 + level.level * 0.012, 1, level.level >= 4))

  return { resources, isDouble, isVein }
}
