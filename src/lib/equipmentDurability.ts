import type { Item, ItemRarity } from '@/types/game'

const RARITY_DURABILITY: Record<ItemRarity, number> = {
  common: 100,
  rare: 150,
  epic: 220,
  legendary: 320,
  mythic: 500,
}

export function getMaxDurability(item: Item): number {
  if (item.slot === 'consumable') return 0
  const base = RARITY_DURABILITY[item.rarity] ?? 100
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  return base + lvl * 15 + stars * 25
}

export function ensureItemDurability(item: Item): Item {
  if (item.slot === 'consumable') return item
  const max = getMaxDurability(item)
  const durability = item.durability ?? max
  return {
    ...item,
    maxDurability: max,
    durability: Math.min(max, Math.max(0, durability)),
  }
}

/** Keep wear ratio when upgrade level/stars change max durability. */
export function preserveDurabilityRatio(item: Item, updates: Partial<Item>): Item {
  const before = ensureItemDurability(item)
  const oldMax = before.maxDurability ?? getMaxDurability(before)
  const oldDur = before.durability ?? oldMax
  const ratio = oldMax > 0 ? oldDur / oldMax : 1

  const after = ensureItemDurability({ ...item, ...updates })
  const newMax = after.maxDurability ?? getMaxDurability(after)
  const newDur = Math.max(0, Math.min(newMax, Math.round(newMax * ratio)))

  return { ...after, durability: newDur }
}

export function getDurabilityRatio(item: Item): number {
  const max = item.maxDurability ?? getMaxDurability(item)
  if (max <= 0) return 1
  const current = item.durability ?? max
  return current / max
}

/** Stat multiplier from durability: 30% at broken → 100% at full */
export function getDurabilityStatMult(item: Item): number {
  if (item.slot === 'consumable') return 1
  const ratio = getDurabilityRatio(item)
  return 0.3 + 0.7 * ratio
}

export function getRepairCost(item: Item): number {
  const max = item.maxDurability ?? getMaxDurability(item)
  const current = item.durability ?? max
  const missing = max - current
  if (missing <= 0) return 0
  const rarityMult: Record<ItemRarity, number> = {
    common: 1, rare: 1.5, epic: 2.5, legendary: 4, mythic: 6,
  }
  const rm = rarityMult[item.rarity] ?? 1
  return Math.ceil(missing * 2 * rm)
}

export function repairItemFull(item: Item): Item {
  const max = getMaxDurability(item)
  return { ...item, maxDurability: max, durability: max }
}

export function wearItem(item: Item, amount: number): Item {
  const max = item.maxDurability ?? getMaxDurability(item)
  const current = item.durability ?? max
  return { ...item, maxDurability: max, durability: Math.max(0, current - amount) }
}

export function formatDurability(item: Item): string {
  const max = item.maxDurability ?? getMaxDurability(item)
  const current = item.durability ?? max
  return `${current}/${max}`
}

export function needsRepair(item: Item): boolean {
  const max = item.maxDurability ?? getMaxDurability(item)
  const current = item.durability ?? max
  return current < max
}
