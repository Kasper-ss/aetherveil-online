import type { Player, ResourceId } from '@/types/game'
import { RESOURCES } from '@/data/classes'
import {
  getCityBuildingDef,
  getCityLevelMultiplier,
  type CityBuildingBonuses,
  type CityBuildingDef,
  type CityBuildingId,
} from '@/data/cityBuildings'
import {
  getCompletedCityBuildings,
  getCityBuildingEffectiveLevel,
  isCityBuildingActiveForBonuses,
} from '@/lib/cityState'

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
    if (!isCityBuildingActiveForBonuses(placed)) continue
    const def = getCityBuildingDef(placed.buildingId as CityBuildingId)
    applyBonusField(
      result,
      def.bonuses,
      getCityLevelMultiplier(getCityBuildingEffectiveLevel(placed)),
    )
  }
  return result
}

const BONUS_LABELS: Partial<Record<keyof CityBuildingBonuses, string>> = {
  energyRegen: 'восстановлению энергии',
  maxEnergy: 'макс. энергии',
  mobGold: 'золоту',
  def: 'защите',
  atk: 'атаке',
  exp: 'опыту',
  gatherResources: 'ресурсам',
  craftSuccess: 'крафту и зельям',
  rareLoot: 'редкой руде с мобов',
  allRewards: 'всем наградам',
}

export function scaleBuildingBonusValue(baseMult: number, level: number): number {
  return 1 + (baseMult - 1) * getCityLevelMultiplier(level)
}

export function formatBuildingBonusPct(baseMult: number, level: number): string {
  const scaled = scaleBuildingBonusValue(baseMult, level)
  return `+${Math.round((scaled - 1) * 100)}%`
}

export function getBuildingBonusLines(
  def: CityBuildingDef,
  level: number,
  nextLevel?: number,
): string[] {
  const lines: string[] = []
  for (const [key, label] of Object.entries(BONUS_LABELS) as [keyof CityBuildingBonuses, string][]) {
    const base = def.bonuses[key]
    if (!base) continue
    let line = `${formatBuildingBonusPct(base, level)} к ${label}`
    if (nextLevel && nextLevel > level) {
      line += ` → ${formatBuildingBonusPct(base, nextLevel)}`
    }
    lines.push(line)
  }
  if (def.passiveRates) {
    for (const [rid, rate] of Object.entries(def.passiveRates)) {
      if (!rate) continue
      const resId = rid as ResourceId
      const label = RESOURCES[resId]?.nameRu ?? rid
      const current = rate * getCityLevelMultiplier(level)
      let line = `${current.toFixed(1)}/ч ${label}`
      if (nextLevel && nextLevel > level) {
        const next = rate * getCityLevelMultiplier(nextLevel)
        line += ` → ${next.toFixed(1)}/ч`
      }
      lines.push(line)
    }
  }
  return lines
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
