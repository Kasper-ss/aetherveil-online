import type { Item, ItemRarity, Player, ResourceId, Stats } from '@/types/game'
import { getProfessionExp, getProfessionRank } from '@/lib/professionProgress'

const RARITY_CHAIN: ItemRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic']

export const RARITY_LEVEL_GATE = 60
export const RARITY_BLACKSMITH_RANK_LEGENDARY = 10
export const RARITY_BLACKSMITH_RANK_MYTHIC = 20

export function getNextRarity(rarity: ItemRarity): ItemRarity | null {
  const idx = RARITY_CHAIN.indexOf(rarity)
  if (idx < 0 || idx >= RARITY_CHAIN.length - 1) return null
  return RARITY_CHAIN[idx + 1]
}

/** Extra copies besides the selected item (2 identical items of same rarity → 1 upgraded). */
export const RARITY_DUPLICATES_REQUIRED = 1
export const RARITY_ITEMS_TOTAL_REQUIRED = RARITY_DUPLICATES_REQUIRED + 1

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

export function getRarityUpgradeBlockReason(item: Item, player: Player): string | null {
  const next = getNextRarity(item.rarity)
  if (!next) return null
  if ((next === 'legendary' || next === 'mythic') && player.level < RARITY_LEVEL_GATE) {
    return `Легендарная и мифическая редкость доступны с ${RARITY_LEVEL_GATE} уровня`
  }
  if (next === 'legendary' || next === 'mythic') {
    const rank = getProfessionRank(getProfessionExp(player, 'blacksmith'))
    const need = next === 'legendary' ? RARITY_BLACKSMITH_RANK_LEGENDARY : RARITY_BLACKSMITH_RANK_MYTHIC
    if (rank < need) {
      return `Нужен ранг кузнеца ${need}+ (сейчас ${rank})`
    }
  }
  return null
}

export function canUpgradeRarityForPlayer(item: Item, player: Player): boolean {
  return canUpgradeRarity(item) && getRarityUpgradeBlockReason(item, player) === null
}

export function countDuplicateItems(
  items: Item[],
  templateId: string,
  rarity: ItemRarity,
  excludeInstanceId?: string,
): number {
  return items.filter(
    (i) =>
      i.id === templateId
      && i.rarity === rarity
      && i.slot !== 'consumable'
      && i.instanceId !== excludeInstanceId,
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
