import type { Player, ResourceId } from '@/types/game'
import type { CityBuildingDef } from '@/data/cityBuildings'

export function canAffordCityCosts(
  player: Player,
  goldCost: number,
  resourceCosts: Partial<Record<ResourceId, number>>,
): boolean {
  if (player.gold < goldCost) return false
  for (const [rid, amt] of Object.entries(resourceCosts)) {
    if (!amt) continue
    if ((player.resources[rid as ResourceId] ?? 0) < amt) return false
  }
  return true
}

export function formatCityCostLine(
  goldCost: number,
  resourceCosts: Partial<Record<ResourceId, number>>,
): string {
  const parts: string[] = []
  if (goldCost > 0) parts.push(`${goldCost.toLocaleString('ru-RU')} 🪙`)
  for (const [rid, amt] of Object.entries(resourceCosts)) {
    if (!amt) continue
    parts.push(`${amt} ${rid}`)
  }
  return parts.join(' · ')
}

export function getCityBuildMissing(
  player: Player,
  def: CityBuildingDef,
): Array<{ type: 'gold' | 'resource'; id?: ResourceId; need: number; have: number }> {
  const missing: Array<{ type: 'gold' | 'resource'; id?: ResourceId; need: number; have: number }> = []
  if (player.gold < def.goldCost) {
    missing.push({ type: 'gold', need: def.goldCost, have: player.gold })
  }
  for (const [rid, amt] of Object.entries(def.resourceCosts)) {
    if (!amt) continue
    const id = rid as ResourceId
    const have = player.resources[id] ?? 0
    if (have < amt) missing.push({ type: 'resource', id, need: amt, have })
  }
  return missing
}
