import type { CraftRecipe, Item, ItemRarity, Player, ResourceId } from '@/types/game'
import { ensureItemDurability, resolveMaxDurability } from '@/lib/equipmentDurability'
import { getCraftSuccessMultiplier } from '@/lib/playerBuffs'

function bsLevel(player: Player, skillIndex: number): number {
  return player.professionLevels.blacksmith?.[skillIndex] ?? 0
}

export function getBlacksmithCraftGoldDiscount(player: Player): number {
  return Math.min(0.5, bsLevel(player, 5) * 0.05)
}

export function getBlacksmithCraftResourceDiscount(player: Player): number {
  return Math.min(0.35, bsLevel(player, 8) * 0.03)
}

export function getBlacksmithDoubleCraftChance(_player: Player): number {
  return 0
}

export function getBlacksmithRarityUpgradeChance(player: Player): number {
  const master = bsLevel(player, 4) * 0.03
  const legendary = bsLevel(player, 8) * 0.02
  const base = master + legendary
  return Math.min(0.45, base * getCraftSuccessMultiplier(player))
}

function scaleResources(
  resources: Partial<Record<ResourceId, number>>,
  mult: number,
): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {}
  for (const [k, v] of Object.entries(resources)) {
    if (v) out[k as ResourceId] = Math.max(1, Math.ceil(v * mult))
  }
  return out
}

export function applyBlacksmithCraftCost(player: Player, recipe: CraftRecipe): CraftRecipe {
  const goldDisc = getBlacksmithCraftGoldDiscount(player)
  const resDisc = getBlacksmithCraftResourceDiscount(player)
  if (goldDisc <= 0 && resDisc <= 0) return recipe
  return {
    ...recipe,
    goldCost: Math.max(1, Math.ceil(recipe.goldCost * (1 - goldDisc))),
    resources: scaleResources(recipe.resources, 1 - resDisc),
  }
}

const RARITY_UP: Record<ItemRarity, ItemRarity | null> = {
  common: 'rare',
  rare: 'epic',
  epic: 'legendary',
  legendary: 'mythic',
  mythic: null,
  divine: null,
}

function bumpRarity(item: Item): Item {
  const next = RARITY_UP[item.rarity]
  if (!next) return item
  const stats = { ...item.stats }
  for (const [k, v] of Object.entries(stats)) {
    if (typeof v === 'number') stats[k as keyof typeof stats] = Math.floor(v * 1.18)
  }
  return ensureItemDurability({ ...item, rarity: next, stats })
}

export function applyBlacksmithCraftBonuses(player: Player, item: Item): Item {
  if (item.slot === 'consumable') return item

  let result = { ...item }
  const craftMult = getCraftSuccessMultiplier(player)
  const allMult = (1 + bsLevel(player, 9) * 0.05) * craftMult
  const weaponAtkBonus = bsLevel(player, 0) * 0.02
  const armorDefBonus = bsLevel(player, 3) * 0.02
  const flatAtk = bsLevel(player, 6)
  const durabilityBonus = 1 + bsLevel(player, 1) * 0.01 + bsLevel(player, 4) * 0.02

  const stats = { ...result.stats }
  for (const [k, v] of Object.entries(stats)) {
    if (typeof v !== 'number') continue
    let mult = allMult
    if (k === 'atk' && result.slot === 'weapon') mult += weaponAtkBonus
    if (k === 'def' && ['helmet', 'chestplate', 'leggings', 'boots'].includes(result.slot)) mult += armorDefBonus
    stats[k as keyof typeof stats] = Math.floor(v * mult)
  }
  if (result.slot === 'weapon' && flatAtk > 0) {
    stats.atk = (stats.atk ?? 0) + flatAtk
  }
  result = { ...result, stats }

  const max = Math.floor(resolveMaxDurability(result) * durabilityBonus)
  result = ensureItemDurability({
    ...result,
    maxDurability: max,
    durability: max,
  })

  const rarityChance = getBlacksmithRarityUpgradeChance(player)
  if (rarityChance > 0 && Math.random() < rarityChance) {
    result = bumpRarity(result)
  }

  return result
}
