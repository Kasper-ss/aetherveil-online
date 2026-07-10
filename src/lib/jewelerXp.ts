import type { ResourceId } from '@/types/game'
import { parseJewelResourceId } from '@/lib/jewelResources'

export const JEWELER_XP = {
  studyComplete: 12,
  combine: (level: number) => 3 + level,
  upgrade: (level: number) => 5 + level * 2,
  buyPerJewel: 8,
  sellPerJewel: 3,
} as const

export function countJewelsInBundle(bundle?: Partial<Record<ResourceId, number>>): number {
  if (!bundle) return 0
  let total = 0
  for (const [rid, amt] of Object.entries(bundle)) {
    if (!amt) continue
    if (parseJewelResourceId(rid as ResourceId)) total += amt
  }
  return total
}

export function jewelSellXp(amount: number): number {
  return amount * JEWELER_XP.sellPerJewel
}
