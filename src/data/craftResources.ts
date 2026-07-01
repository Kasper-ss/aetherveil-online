import type { ResourceId } from '@/types/game'
import { FISH_TABLE } from '@/data/fishing'

/** Классические ресурсы (шахта, поле, охота, ранняя башня) */
export const MAIN_CRAFT_RESOURCE_IDS: ResourceId[] = [
  'iron_ore',
  'herb',
  'hide',
  'meat',
  'gem_shard',
  'mana_crystal',
  'aether_dust',
  'star_shard',
  'upgrade_core',
]

/** Ресурсы из новых систем: руда, травы, рыба, редкие материалы */
export const NEW_CRAFT_RESOURCE_IDS: ResourceId[] = [
  'stone_chunk',
  'gold_ore',
  'raw_diamond',
  'mithril_ore',
  'adamantite',
  'sulfur',
  'herb_mint',
  'herb_lotus',
  'herb_phoenix',
  'herb_void',
  ...FISH_TABLE.map((f) => f.id),
  'rare_spice',
  'abyssal_pearl',
]

export const LUCKY_MAIN_RESOURCE_COST = 7_777_777
export const LUCKY_EXTRA_RESOURCE_COST = 7_777
export const LUCKY_GOLD_COST = 7_777_777

/** Ресурсы Lucky-крафта (дополнительно к основному паку) */
export const LUCKY_CRAFT_RESOURCE_IDS: ResourceId[] = [
  'adamantite',
  'mithril_ore',
  'meat',
  'bone',
  'gem_shard',
  'aether_dust',
]

export function buildMainResourcePack(amount: number): Partial<Record<ResourceId, number>> {
  const pack: Partial<Record<ResourceId, number>> = {}
  for (const id of MAIN_CRAFT_RESOURCE_IDS) pack[id] = amount
  return pack
}

export function buildNewResourcePack(amount: number): Partial<Record<ResourceId, number>> {
  const pack: Partial<Record<ResourceId, number>> = {}
  for (const id of NEW_CRAFT_RESOURCE_IDS) pack[id] = amount
  return pack
}

export function buildLuckyCraftResources(): Partial<Record<ResourceId, number>> {
  const pack = buildMainResourcePack(LUCKY_MAIN_RESOURCE_COST)
  for (const id of LUCKY_CRAFT_RESOURCE_IDS) {
    pack[id] = (pack[id] ?? 0) + LUCKY_EXTRA_RESOURCE_COST
  }
  return pack
}

export type EpicCraftTier = 'light' | 'mid' | 'heavy' | 'jewelry'

const EPIC_RESOURCE_TIERS: Record<EpicCraftTier, Partial<Record<ResourceId, number>>> = {
  light: {
    stone_chunk: 28,
    gold_ore: 24,
    sulfur: 12,
    herb_mint: 14,
    herb_lotus: 10,
    fish_perch: 10,
    fish_trout: 8,
    rare_spice: 6,
  },
  mid: {
    stone_chunk: 38,
    gold_ore: 32,
    mithril_ore: 22,
    sulfur: 16,
    herb_mint: 18,
    herb_lotus: 14,
    herb_phoenix: 10,
    fish_salmon: 12,
    fish_pike: 10,
    rare_spice: 9,
    abyssal_pearl: 5,
  },
  heavy: {
    stone_chunk: 48,
    gold_ore: 42,
    mithril_ore: 32,
    adamantite: 24,
    raw_diamond: 18,
    sulfur: 20,
    herb_lotus: 16,
    herb_phoenix: 14,
    herb_void: 10,
    fish_tuna: 14,
    fish_swordfish: 12,
    fish_aether_koi: 6,
    rare_spice: 12,
    abyssal_pearl: 8,
  },
  jewelry: {
    raw_diamond: 26,
    adamantite: 18,
    gold_ore: 20,
    mithril_ore: 14,
    herb_phoenix: 16,
    herb_void: 12,
    fish_cod: 10,
    fish_lobster: 10,
    fish_eel: 8,
    rare_spice: 10,
    abyssal_pearl: 7,
  },
}

const LEGENDARY_RESOURCE_MULT = 3

export function getEpicCraftResources(tier: EpicCraftTier): Partial<Record<ResourceId, number>> {
  return { ...EPIC_RESOURCE_TIERS[tier] }
}

export function getLegendaryCraftResources(tier: EpicCraftTier): Partial<Record<ResourceId, number>> {
  const base = EPIC_RESOURCE_TIERS[tier]
  const scaled: Partial<Record<ResourceId, number>> = {}
  for (const [k, v] of Object.entries(base)) {
    if (v) scaled[k as ResourceId] = v * LEGENDARY_RESOURCE_MULT
  }
  return scaled
}

/** Слот → тир ресурсов для эпик/легендарных сетов */
export function craftTierForSlot(slot: string): EpicCraftTier {
  switch (slot) {
    case 'weapon':
      return 'heavy'
    case 'chestplate':
      return 'heavy'
    case 'leggings':
      return 'mid'
    case 'necklace':
    case 'ring':
      return 'jewelry'
    case 'helmet':
    case 'boots':
    default:
      return 'light'
  }
}

export function slotFromResultItemId(resultItemId: string): string {
  if (resultItemId.includes('weapon')) return 'weapon'
  if (resultItemId.includes('chestplate')) return 'chestplate'
  if (resultItemId.includes('leggings')) return 'leggings'
  if (resultItemId.includes('necklace')) return 'necklace'
  if (resultItemId.includes('ring')) return 'ring'
  if (resultItemId.includes('boots')) return 'boots'
  return 'helmet'
}
