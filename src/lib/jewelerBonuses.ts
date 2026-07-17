import type { CraftRecipe, Item, Player } from '@/types/game'
import { ensureItemDurability } from '@/lib/equipmentDurability'
import { getProfessionSkillLevel, getProfessionMythicSkillLevel } from '@/lib/professionBonuses'

const ACCESSORY_SLOTS = new Set(['necklace', 'ring'])

export function applyJewelerCraftCost(_player: Player, recipe: CraftRecipe): CraftRecipe {
  return recipe
}

export function applyJewelerCraftBonuses(player: Player, item: Item): Item {
  if (!ACCESSORY_SLOTS.has(item.slot)) return item

  const stats = { ...item.stats }
  const fineSetting = getProfessionSkillLevel(player, 'jeweler', 'jw_2') * 0.02
  const crown = getProfessionSkillLevel(player, 'jeweler', 'jw_10') * 0.10
  const mythic = getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m1') * 0.08
  const prismatic = getProfessionSkillLevel(player, 'jeweler', 'jw_8') * 2
  const etherInlay = getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m4') * 0.05
  const mult = 1 + fineSetting + crown + mythic + etherInlay

  for (const [k, v] of Object.entries(stats)) {
    if (typeof v === 'number') stats[k as keyof typeof stats] = Math.floor(v * mult)
  }
  stats.crit = (stats.crit ?? 0) + getProfessionSkillLevel(player, 'jeweler', 'jw_3')
  stats.atk = (stats.atk ?? 0) + prismatic
  stats.def = (stats.def ?? 0) + prismatic
  stats.hp = (stats.hp ?? 0) + prismatic
  stats.speed = (stats.speed ?? 0) + prismatic
  stats.stealth = (stats.stealth ?? 0) + prismatic

  return ensureItemDurability({ ...item, stats })
}

export function rollJewelerBonusGem(player: Player): boolean {
  const chance = Math.min(0.35, getProfessionMythicSkillLevel(player, 'jeweler', 'jw_m5') * 0.04)
  return chance > 0 && Math.random() < chance
}
