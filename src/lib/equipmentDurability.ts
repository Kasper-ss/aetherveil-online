import type { Item, ItemRarity, Player } from '@/types/game'

const RARITY_DURABILITY: Record<ItemRarity, number> = {
  common: 100,
  rare: 150,
  epic: 220,
  legendary: 320,
  mythic: 500,
  divine: 750,
}

/** Blacksmith bs_2 (Закалка): +1% weapon max durability per level — inlined to avoid circular imports. */
function weaponTemperDurabilityMult(player: Player): number {
  const lvl = player.professionLevels?.blacksmith?.[1] ?? 0
  return 1 + lvl * 0.01
}

export function getMaxDurability(item: Item): number {
  if (item.slot === 'consumable') return 0
  const base = RARITY_DURABILITY[item.rarity] ?? 100
  const lvl = item.upgradeLevel ?? 1
  const stars = item.starLevel ?? 0
  return base + lvl * 15 + stars * 25
}

/** Never shrink stored max below formula or blacksmith bonus — avoids stat loss after fights/repair. */
export function resolveMaxDurability(item: Item, player?: Player | null): number {
  if (item.slot === 'consumable') return 0
  const calcMax = getMaxDurability(item)
  let max = Math.max(calcMax, item.maxDurability ?? calcMax)
  if (player && item.slot === 'weapon') {
    const tempered = Math.floor(calcMax * weaponTemperDurabilityMult(player))
    max = Math.max(max, tempered)
  }
  return max
}

export function ensureItemDurability(item: Item): Item {
  if (item.slot === 'consumable') return item
  const max = resolveMaxDurability(item)
  const prevMax = item.maxDurability ?? getMaxDurability(item)
  const prevDur = item.durability ?? prevMax
  const ratio = prevMax > 0 ? Math.min(1, prevDur / prevMax) : 1
  const durability = Math.min(max, Math.max(0, Math.round(max * ratio)))
  return {
    ...item,
    maxDurability: max,
    durability,
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
  const max = resolveMaxDurability(item)
  if (max <= 0) return 1
  const current = item.durability ?? max
  return Math.min(1, current / max)
}

/** Stat multiplier from durability — only fully broken gear reduces stats. */
export function getDurabilityStatMult(item: Item): number {
  if (item.slot === 'consumable') return 1
  const max = resolveMaxDurability(item)
  if (max <= 0) return 1
  const current = item.durability ?? max
  if (current <= 0) return 0.3
  return 1
}

export function getRepairCost(item: Item): number {
  const normalized = ensureItemDurability(item)
  const max = normalized.maxDurability ?? resolveMaxDurability(normalized)
  const current = normalized.durability ?? max
  const missing = max - current
  if (missing <= 0) return 0
  const rarityMult: Record<ItemRarity, number> = {
    common: 1, rare: 1.5, epic: 2.5, legendary: 4, mythic: 6, divine: 9,
  }
  const rm = rarityMult[item.rarity] ?? 1
  return Math.ceil(missing * 2 * rm)
}

export function repairItemFull(item: Item): Item {
  const max = resolveMaxDurability(item)
  return { ...item, maxDurability: max, durability: max }
}

export function wearItem(item: Item, amount: number): Item {
  const max = resolveMaxDurability(item)
  const current = item.durability ?? max
  return { ...item, maxDurability: max, durability: Math.max(0, current - amount) }
}

export function formatDurability(item: Item): string {
  const max = resolveMaxDurability(item)
  const current = item.durability ?? max
  return `${current}/${max}`
}

export function needsRepair(item: Item): boolean {
  const normalized = ensureItemDurability(item)
  const max = normalized.maxDurability ?? resolveMaxDurability(normalized)
  const current = normalized.durability ?? max
  return current < max
}
