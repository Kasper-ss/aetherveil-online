import type { GrindLevel } from '@/lib/professionGrind'
import { getGrindLevelData, getUnlockedGrindLevel, rollGrindRewards } from '@/lib/professionGrind'

export const HUNT_LEVELS: GrindLevel[] = [
  {
    level: 1,
    nameRu: 'Лесная опушка',
    energyCost: 12,
    xpPerAction: 3,
    xpToUnlock: 0,
    drops: [
      { resource: 'hide', weight: 55, amount: [2, 4] },
      { resource: 'meat', weight: 55, amount: [2, 5] },
      { resource: 'herb', weight: 15, amount: [1, 2] },
    ],
    doubleChance: 0.07,
    specialChance: 0.03,
    specialLabelRu: 'Альфа-трофей',
  },
  {
    level: 2,
    nameRu: 'Дикие чащи',
    energyCost: 16,
    xpPerAction: 4,
    xpToUnlock: 260,
    drops: [
      { resource: 'hide', weight: 48, amount: [3, 5] },
      { resource: 'meat', weight: 51, amount: [3, 6] },
      { resource: 'gem_shard', weight: 24, amount: [1, 1] },
      { resource: 'herb', weight: 13, amount: [1, 3] },
    ],
    doubleChance: 0.08,
    specialChance: 0.04,
    specialLabelRu: 'Альфа-трофей',
  },
  {
    level: 3,
    nameRu: 'Болотные тропы',
    energyCost: 20,
    xpPerAction: 5,
    xpToUnlock: 650,
    drops: [
      { resource: 'hide', weight: 35, amount: [3, 6] },
      { resource: 'meat', weight: 30, amount: [4, 7] },
      { resource: 'gem_shard', weight: 20, amount: [1, 2] },
      { resource: 'rare_spice', weight: 15, amount: [1, 1] },
    ],
    doubleChance: 0.09,
    specialChance: 0.05,
    specialLabelRu: 'Альфа-трофей',
  },
  {
    level: 4,
    nameRu: 'Горные ущелья',
    energyCost: 24,
    xpPerAction: 6,
    xpToUnlock: 1400,
    drops: [
      { resource: 'hide', weight: 30, amount: [4, 7] },
      { resource: 'meat', weight: 25, amount: [5, 8] },
      { resource: 'gem_shard', weight: 25, amount: [1, 2] },
      { resource: 'abyssal_pearl', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.1,
    specialChance: 0.06,
    specialLabelRu: 'Альфа-трофей',
  },
  {
    level: 5,
    nameRu: 'Земли легендарных зверей',
    energyCost: 30,
    xpPerAction: 7,
    xpToUnlock: 2800,
    drops: [
      { resource: 'hide', weight: 28, amount: [5, 8] },
      { resource: 'meat', weight: 22, amount: [6, 10] },
      { resource: 'gem_shard', weight: 25, amount: [2, 3] },
      { resource: 'star_shard', weight: 15, amount: [1, 1] },
      { resource: 'aether_dust', weight: 10, amount: [1, 1] },
    ],
    doubleChance: 0.12,
    specialChance: 0.08,
    specialLabelRu: 'Альфа-трофей',
  },
]

export const getHuntLevelData = (level: number) => getGrindLevelData(HUNT_LEVELS, level)
export const getUnlockedHuntLevel = (xp: number) => getUnlockedGrindLevel(HUNT_LEVELS, xp)
export const rollHuntRewards = rollGrindRewards
