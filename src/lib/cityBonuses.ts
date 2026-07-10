import type { Player } from '@/types/game'
import {
  getCityBuildingDef,
  getCityLevelMultiplier,
  type CityBuildingBonuses,
  type CityBuildingId,
} from '@/data/cityBuildings'
import { getCompletedCityBuildings, isCityBuildingReady } from '@/lib/cityState'

export interface CityMultipliers {
  energyRegen: number
  maxEnergy: number
  mobGold: number
  def: number
  atk: number
  exp: number
  gatherResources: number
  craftSuccess: number
  rareLoot: number
  allRewards: number
}

const NEUTRAL: CityMultipliers = {
  energyRegen: 1,
  maxEnergy: 1,
  mobGold: 1,
  def: 1,
  atk: 1,
  exp: 1,
  gatherResources: 1,
  craftSuccess: 1,
  rareLoot: 1,
  allRewards: 1,
}

function applyBonusField(
  target: CityMultipliers,
  bonuses: CityBuildingBonuses,
  levelMult: number,
): void {
  const scale = (base: number) => 1 + (base - 1) * levelMult
  if (bonuses.energyRegen) target.energyRegen *= scale(bonuses.energyRegen)
  if (bonuses.maxEnergy) target.maxEnergy *= scale(bonuses.maxEnergy)
  if (bonuses.mobGold) target.mobGold *= scale(bonuses.mobGold)
  if (bonuses.def) target.def *= scale(bonuses.def)
  if (bonuses.atk) target.atk *= scale(bonuses.atk)
  if (bonuses.exp) target.exp *= scale(bonuses.exp)
  if (bonuses.gatherResources) target.gatherResources *= scale(bonuses.gatherResources)
  if (bonuses.craftSuccess) target.craftSuccess *= scale(bonuses.craftSuccess)
  if (bonuses.rareLoot) target.rareLoot *= scale(bonuses.rareLoot)
  if (bonuses.allRewards) target.allRewards *= scale(bonuses.allRewards)
}

export function getCityMultipliers(player: Player): CityMultipliers {
  const result = { ...NEUTRAL }
  for (const placed of getCompletedCityBuildings(player)) {
    if (!isCityBuildingReady(placed)) continue
    const def = getCityBuildingDef(placed.buildingId as CityBuildingId)
    applyBonusField(result, def.bonuses, getCityLevelMultiplier(placed.level))
  }
  return result
}

function pct(mult: number): string {
  return `+${Math.round((mult - 1) * 100)}%`
}

export function getCityBonusDetailLines(player: Player): string[] {
  const m = getCityMultipliers(player)
  const lines: string[] = []
  if (m.energyRegen > 1) lines.push(`${pct(m.energyRegen)} к восстановлению энергии`)
  if (m.maxEnergy > 1) lines.push(`${pct(m.maxEnergy)} к макс. энергии`)
  if (m.mobGold > 1) lines.push(`${pct(m.mobGold)} к золоту`)
  if (m.def > 1) lines.push(`${pct(m.def)} к защите`)
  if (m.atk > 1) lines.push(`${pct(m.atk)} к атаке`)
  if (m.exp > 1) lines.push(`${pct(m.exp)} к опыту`)
  if (m.gatherResources > 1) lines.push(`${pct(m.gatherResources)} к ресурсам`)
  if (m.craftSuccess > 1) lines.push(`${pct(m.craftSuccess)} к крафту и зельям`)
  if (m.rareLoot > 1) lines.push(`${pct(m.rareLoot)} к редкой руде с мобов`)
  if (m.allRewards > 1) lines.push(`${pct(m.allRewards)} ко всем наградам`)
  return lines
}
