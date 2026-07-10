import type { GrindLevel } from '@/lib/professionGrind'
import { getGrindLevelData, getUnlockedGrindLevel, rollGrindRewards } from '@/lib/professionGrind'

export const GEM_SITE_LEVELS: GrindLevel[] = [
  {
    level: 1,
    nameRu: 'Поверхностные жилы',
    energyCost: 14,
    xpPerAction: 3,
    xpToUnlock: 0,
    drops: [
      { resource: 'gem_shard', weight: 60, amount: [1, 3] },
      { resource: 'stone_chunk', weight: 30, amount: [1, 2] },
      { resource: 'sulfur', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.06,
    specialChance: 0.025,
    specialLabelRu: 'Кристальная жила',
  },
  {
    level: 2,
    nameRu: 'Сияющие пещеры',
    energyCost: 18,
    xpPerAction: 4,
    xpToUnlock: 300,
    drops: [
      { resource: 'gem_shard', weight: 50, amount: [2, 4] },
      { resource: 'mana_crystal', weight: 20, amount: [1, 1] },
      { resource: 'iron_ore', weight: 30, amount: [1, 2] },
    ],
    doubleChance: 0.07,
    specialChance: 0.035,
    specialLabelRu: 'Кристальная жила',
  },
  {
    level: 3,
    nameRu: 'Глубинные кристаллы',
    energyCost: 22,
    xpPerAction: 5,
    xpToUnlock: 750,
    drops: [
      { resource: 'gem_shard', weight: 40, amount: [2, 5] },
      { resource: 'mana_crystal', weight: 30, amount: [1, 2] },
      { resource: 'gold_ore', weight: 20, amount: [1, 2] },
      { resource: 'jewel_ruby', weight: 5, amount: [1, 1] },
      { resource: 'upgrade_core', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.08,
    specialChance: 0.045,
    specialLabelRu: 'Кристальная жила',
  },
  {
    level: 4,
    nameRu: 'Алмазный разлом',
    energyCost: 26,
    xpPerAction: 6,
    xpToUnlock: 1700,
    drops: [
      { resource: 'gem_shard', weight: 35, amount: [3, 5] },
      { resource: 'mana_crystal', weight: 30, amount: [2, 3] },
      { resource: 'raw_diamond', weight: 20, amount: [1, 1] },
      { resource: 'abyssal_pearl', weight: 15, amount: [1, 1] },
      { resource: 'jewel_sapphire', weight: 8, amount: [1, 1] },
    ],
    doubleChance: 0.09,
    specialChance: 0.055,
    specialLabelRu: 'Кристальная жила',
  },
  {
    level: 5,
    nameRu: 'Святилище самоцветов',
    energyCost: 32,
    xpPerAction: 7,
    xpToUnlock: 3400,
    drops: [
      { resource: 'gem_shard', weight: 30, amount: [3, 6] },
      { resource: 'mana_crystal', weight: 25, amount: [2, 4] },
      { resource: 'star_shard', weight: 20, amount: [1, 2] },
      { resource: 'aether_dust', weight: 15, amount: [1, 1] },
      { resource: 'raw_diamond', weight: 10, amount: [1, 2] },
      { resource: 'jewel_diamond', weight: 6, amount: [1, 1] },
      { resource: 'jewel_opal', weight: 5, amount: [1, 1] },
    ],
    doubleChance: 0.11,
    specialChance: 0.07,
    specialLabelRu: 'Кристальная жила',
  },
]

export const getGemSiteLevelData = (level: number) => getGrindLevelData(GEM_SITE_LEVELS, level)
export const getUnlockedGemSiteLevel = (xp: number) => getUnlockedGrindLevel(GEM_SITE_LEVELS, xp)
export const rollGemSiteRewards = rollGrindRewards
