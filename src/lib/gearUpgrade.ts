import type { Item, Player, ResourceId } from '@/types/game'
import type { EquipSlot } from '@/data/items'
import { getProfessionMythicSkillLevel, getProfessionSkillLevel } from '@/lib/professionBonuses'
import { getRankCraftDiscount } from '@/lib/playerRank'

export const UPGRADEABLE_GEAR_SLOTS: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'necklace', 'ring', 'weapon',
]

export type GearUpgradeCost = {
  gold: number
  resources: Partial<Record<ResourceId, number>>
}

export function isAccessoryItem(item: Item): boolean {
  return item.slot === 'necklace' || item.slot === 'ring'
}

export function isUpgradeableGear(item: Item): boolean {
  return item.slot !== 'consumable' && item.slot !== 'pet'
}

export function getStarLevelUpgradeCostMult(stars: number): number {
  if (stars <= 0) return 1
  return 1 + stars * 1.2 + stars * stars * 0.8
}

function scaleCost(n: number, mult: number): number {
  return Math.max(1, Math.ceil(n * mult))
}

export function getUpgradeLevelCost(item: Item): GearUpgradeCost {
  const lvl = item.upgradeLevel ?? 1
  if (lvl >= 10) return { gold: 0, resources: {} }

  const rarityMult: Record<string, number> = { common: 1, rare: 2, epic: 4, legendary: 6, mythic: 10, divine: 12 }
  const rm = rarityMult[item.rarity] ?? 1
  const starMult = getStarLevelUpgradeCostMult(item.starLevel ?? 0)
  const scale = (n: number) => scaleCost(n, starMult)

  if (isAccessoryItem(item)) {
    return {
      gold: Math.floor(70 * lvl * lvl * rm * starMult),
      resources: {
        upgrade_core: scale(Math.ceil(lvl / 2)),
        gem_shard: scale(2 + lvl),
        mana_crystal: lvl >= 3 ? scale(Math.ceil(lvl / 2)) : 0,
        aether_dust: lvl >= 6 && rm >= 4 ? scale(Math.ceil(lvl / 4)) : 0,
      },
    }
  }

  return {
    gold: Math.floor(80 * lvl * lvl * rm * starMult),
    resources: {
      upgrade_core: scale(Math.ceil(lvl / 2)),
      iron_ore: scale(lvl * 2),
      gem_shard: lvl >= 5 ? scale(Math.ceil(lvl / 3)) : 0,
    },
  }
}

export function getStarUpgradeCost(item: Item): GearUpgradeCost {
  const stars = item.starLevel ?? 0
  if (stars >= 10) return { gold: 0, resources: {} }
  const next = stars + 1
  const rarityMult: Record<string, number> = { common: 1, rare: 1.15, epic: 1.35, legendary: 1.6, mythic: 2, divine: 2.4 }
  const rm = rarityMult[item.rarity] ?? 1

  if (isAccessoryItem(item)) {
    return {
      gold: Math.floor(130 * next * next * rm),
      resources: {
        star_shard: next,
        gem_shard: Math.ceil(next * rm),
        mana_crystal: next >= 4 ? Math.ceil(next / 2) : 0,
        aether_dust: next >= 6 ? Math.ceil(next / 3) : 0,
      },
    }
  }

  return {
    gold: Math.floor(150 * next * next),
    resources: {
      star_shard: next,
      gem_shard: Math.ceil(next / 2),
      aether_dust: next >= 5 ? Math.ceil(next / 3) : 0,
    },
  }
}

/** Скидки кузнеца (броня/оружие) и ювелира (аксессуары) на улучшение уровня и звёзд. */
export function applyUpgradeCostDiscounts(player: Player, item: Item, cost: GearUpgradeCost): GearUpgradeCost {
  const bsDiscount = getProfessionMythicSkillLevel(player, 'blacksmith', 'bs_m2') * 0.01
  const jwDiscount = isAccessoryItem(item)
    ? getProfessionSkillLevel(player, 'jeweler', 'jw_5') * 0.003
    : 0
  const discount = Math.min(0.35, bsDiscount + jwDiscount + getRankCraftDiscount(player))
  if (discount <= 0) return cost

  const resources: Partial<Record<ResourceId, number>> = {}
  for (const [rid, amt] of Object.entries(cost.resources)) {
    if (!amt) continue
    resources[rid as ResourceId] = Math.max(1, Math.ceil(amt * (1 - discount)))
  }
  return {
    gold: Math.max(1, Math.ceil(cost.gold * (1 - discount))),
    resources,
  }
}

export function getEffectiveUpgradeLevelCost(player: Player, item: Item): GearUpgradeCost {
  return applyUpgradeCostDiscounts(player, item, getUpgradeLevelCost(item))
}

export function getEffectiveStarUpgradeCost(player: Player, item: Item): GearUpgradeCost {
  return applyUpgradeCostDiscounts(player, item, getStarUpgradeCost(item))
}
