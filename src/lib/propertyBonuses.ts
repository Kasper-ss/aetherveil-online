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

/** Permanent home bonuses — must match labels in realEstate.ts */
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
  if (!getPropertyById(id)) return NEUTRAL
  return { ...NEUTRAL, ...BONUS_BY_PROPERTY[id] }
}

export function getOwnedPropertyTitleId(player: Player): string | undefined {
  const id = player.ownedPropertyId
  if (!id) return undefined
  return getPropertyById(id)?.exclusiveTitleId
}

export interface ActivePropertyInfo {
  propertyId: string
  nameRu: string
  icon: string
  bonusLabelRu: string
  detailLines: string[]
}

function pct(mult: number): string {
  return `+${Math.round((mult - 1) * 100)}%`
}

/** Human-readable breakdown of active numeric bonuses. */
export function getPropertyBonusDetailLines(player: Player): string[] {
  const m = getPropertyMultipliers(player)
  const lines: string[] = []
  if (m.energyRegen > 1) lines.push(`${pct(m.energyRegen)} к скорости восстановления энергии`)
  if (m.maxEnergy > 1) lines.push(`${pct(m.maxEnergy)} к макс. энергии`)
  if (m.mobGold > 1) lines.push(`${pct(m.mobGold)} к золоту с мобов`)
  if (m.def > 1) lines.push(`${pct(m.def)} к защите`)
  if (m.exp > 1) lines.push(`${pct(m.exp)} к опыту с этажей`)
  if (m.gatherResources > 1) lines.push(`${pct(m.gatherResources)} к ресурсам с рыбалки и сбора`)
  if (m.craftSuccess > 1) lines.push(`${pct(m.craftSuccess)} к крафту и улучшениям в Кузнице`)
  if (m.rareLoot > 1) lines.push(`${pct(m.rareLoot)} к шансу редкого лута`)
  if (m.allStats > 1) lines.push(`${pct(m.allStats)} ко всем характеристикам`)
  if (m.allRewards > 1) lines.push(`${pct(m.allRewards)} ко всем наградам`)
  return lines
}

export function getActivePropertyInfo(player: Player): ActivePropertyInfo | null {
  const id = player.ownedPropertyId
  if (!id) return null
  const def = getPropertyById(id)
  if (!def) return null
  const detailLines = getPropertyBonusDetailLines(player)
  return {
    propertyId: id,
    nameRu: def.nameRu,
    icon: def.icon,
    bonusLabelRu: def.bonusLabelRu,
    detailLines: detailLines.length > 0 ? detailLines : [def.bonusLabelRu],
  }
}

export function hasActiveProperty(player: Player): boolean {
  return !!player.ownedPropertyId && !!getPropertyById(player.ownedPropertyId)
}
