import type { GrindLevel } from '@/lib/professionGrind'
import { getGrindLevelData, getUnlockedGrindLevel, rollGrindRewards } from '@/lib/professionGrind'

export const AETHER_RIFT_LEVELS: GrindLevel[] = [
  {
    level: 1,
    nameRu: 'Слабый разлом',
    energyCost: 14,
    xpPerAction: 3,
    xpToUnlock: 0,
    drops: [
      { resource: 'mana_crystal', weight: 55, amount: [1, 3] },
      { resource: 'herb', weight: 25, amount: [1, 2] },
      { resource: 'sulfur', weight: 20, amount: [1, 1] },
    ],
    doubleChance: 0.06,
    specialChance: 0.025,
    specialLabelRu: 'Всплеск маны',
  },
  {
    level: 2,
    nameRu: 'Эфирный источник',
    energyCost: 18,
    xpPerAction: 4,
    xpToUnlock: 290,
    drops: [
      { resource: 'mana_crystal', weight: 45, amount: [2, 4] },
      { resource: 'aether_dust', weight: 25, amount: [1, 1] },
      { resource: 'herb_lotus', weight: 15, amount: [1, 1] },
      { resource: 'gem_shard', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.07,
    specialChance: 0.035,
    specialLabelRu: 'Всплеск маны',
  },
  {
    level: 3,
    nameRu: 'Портал энергии',
    energyCost: 22,
    xpPerAction: 5,
    xpToUnlock: 720,
    drops: [
      { resource: 'mana_crystal', weight: 35, amount: [2, 4] },
      { resource: 'aether_dust', weight: 35, amount: [1, 2] },
      { resource: 'herb_phoenix', weight: 15, amount: [1, 1] },
      { resource: 'star_shard', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.08,
    specialChance: 0.045,
    specialLabelRu: 'Всплеск маны',
  },
  {
    level: 4,
    nameRu: 'Бездна чародея',
    energyCost: 26,
    xpPerAction: 6,
    xpToUnlock: 1650,
    drops: [
      { resource: 'aether_dust', weight: 40, amount: [2, 3] },
      { resource: 'mana_crystal', weight: 30, amount: [2, 4] },
      { resource: 'star_shard', weight: 20, amount: [1, 2] },
      { resource: 'herb_void', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.09,
    specialChance: 0.055,
    specialLabelRu: 'Всплеск маны',
  },
  {
    level: 5,
    nameRu: 'Сердце Эфира',
    energyCost: 32,
    xpPerAction: 7,
    xpToUnlock: 3300,
    drops: [
      { resource: 'aether_dust', weight: 35, amount: [2, 4] },
      { resource: 'star_shard', weight: 30, amount: [1, 3] },
      { resource: 'mana_crystal', weight: 20, amount: [3, 5] },
      { resource: 'herb_void', weight: 10, amount: [1, 2] },
      { resource: 'abyssal_pearl', weight: 5, amount: [1, 1] },
    ],
    doubleChance: 0.11,
    specialChance: 0.07,
    specialLabelRu: 'Всплеск маны',
  },
]

export const getAetherRiftLevelData = (level: number) => getGrindLevelData(AETHER_RIFT_LEVELS, level)
export const getUnlockedAetherRiftLevel = (xp: number) => getUnlockedGrindLevel(AETHER_RIFT_LEVELS, xp)
export const rollAetherRiftRewards = rollGrindRewards
