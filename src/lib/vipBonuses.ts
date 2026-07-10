import type { Player } from '@/types/game'
import { getVipTier } from '@/data/vipTiers'

export function getVipMultipliers(player: Player): { exp: number; gold: number; loot: number } {
  const tier = getVipTier(player.vipLevel ?? 0)
  if (!tier) return { exp: 1, gold: 1, loot: 1 }
  return {
    exp: 1 + tier.expPct,
    gold: 1 + tier.goldPct,
    loot: 1 + tier.lootPct,
  }
}
