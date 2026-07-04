import type { Player } from '@/types/game'
import { getPropertyById } from '@/data/realEstate'

export interface PropertyMultipliers {
  energyRegen: number
  maxEnergy: number
  mobGold: number
  def: number
  exp: number
  gatherResources: number
  craftSuccess: number
  rareLoot: number
  allStats: number
  allRewards: number
}

const NEUTRAL: PropertyMultipliers = {
  energyRegen: 1,
  maxEnergy: 1,
  mobGold: 1,
  def: 1,
  exp: 1,
  gatherResources: 1,
  craftSuccess: 1,
  rareLoot: 1,
  allStats: 1,
  allRewards: 1,
}

const BONUS_BY_PROPERTY: Record<string, Partial<PropertyMultipliers>> = {
  forest_hut: { energyRegen: 1.05 },
  stone_cottage: { mobGold: 1.1 },
  fortified_house: { def: 1.08 },
  guard_tower: { exp: 1.12 },
  hunter_villa: { gatherResources: 1.15 },
  master_mansion: { craftSuccess: 1.1 },
  seeker_castle: { rareLoot: 1.2 },
  sky_penthouse: { maxEnergy: 1.15, energyRegen: 1.08 },
  legend_fortress: { allStats: 1.12 },
  ascension_townhouse: { allRewards: 1.25 },
}

export function getPropertyMultipliers(player: Player): PropertyMultipliers {
  const id = player.ownedPropertyId
  if (!id) return NEUTRAL
  const def = getPropertyById(id)
  if (!def) return NEUTRAL
  return { ...NEUTRAL, ...BONUS_BY_PROPERTY[id] }
}

export function getOwnedPropertyTitleId(player: Player): string | undefined {
  const id = player.ownedPropertyId
  if (!id) return undefined
  return getPropertyById(id)?.exclusiveTitleId
}
