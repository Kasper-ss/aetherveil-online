import type { Item, ItemRarity, ResourceId, Stats } from '@/types/game'

const RARITY_CHAIN: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic']

export function getNextRarity(rarity: ItemRarity): ItemRarity | null {
  const idx = RARITY_CHAIN.indexOf(rarity)
  if (idx < 0 || idx >= RARITY_CHAIN.length - 1) return null
  return RARITY_CHAIN[idx + 1]
}

export const RARITY_DUPLICATES_REQUIRED = 2

export function getRarityUpgradeCost(item: Item): {
  gold: number
  resources: Partial<Record<ResourceId, number>>
} {
  const next = getNextRarity(item.rarity)
  if (!next) return { gold: 0, resources: {} }

  const mult: Record<ItemRarity, number> = {
    common: 1, rare: 2, epic: 4, legendary: 8, mythic: 0,
  }
  const m = mult[item.rarity] ?? 1

  return {
    gold: 400 * m,
    resources: {
      upgrade_core: Math.ceil(m * 1.5),
      gem_shard: m >= 2 ? m : 0,
      aether_dust: m >= 4 ? Math.ceil(m / 2) : 0,
      star_shard: item.rarity === 'legendary' ? 3 : 0,
    },
  }
}

export function canUpgradeRarity(item: Item): boolean {
  return item.slot !== 'consumable' && getNextRarity(item.rarity) !== null
}

export function countDuplicateItems(items: Item[], templateId: string, excludeInstanceId?: string): number {
  return items.filter(
    (i) => i.id === templateId && i.slot !== 'consumable' && i.instanceId !== excludeInstanceId,
  ).length
}

function boostStats(stats: Partial<Stats>, factor: number): Partial<Stats> {
  const result: Partial<Stats> = {}
  for (const [k, v] of Object.entries(stats ?? {})) {
    result[k as keyof Stats] = Math.floor((v as number) * factor)
  }
  return result
}

export function applyRarityUpgrade(item: Item): Item | null {
  const next = getNextRarity(item.rarity)
  if (!next) return null
  const max = item.maxDurability
  const repaired = { ...item, rarity: next, stats: boostStats(item.stats, 1.18) }
  if (max != null) {
    const newMax = Math.floor(max * 1.15)
    repaired.maxDurability = newMax
    repaired.durability = newMax
  }
  return repaired
}
