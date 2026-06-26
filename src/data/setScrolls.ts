import type { CraftRecipe, ShopItem } from '@/types/game'
import type { EquipSlot } from '@/data/items'
import { ALL_ITEMS } from '@/data/items'
import { EPIC_SET_CRAFT_RECIPES, LEGENDARY_SET_CRAFT_RECIPES } from '@/data/setCraftRecipes'

export interface SetScrollProduct {
  scrollId: string
  recipeId: string
  nameRu: string
  descriptionRu: string
  goldPrice: number
  gemsPrice?: number
  rarity: 'epic' | 'legendary'
  setId: string
  setName: string
  slot: EquipSlot
}

const SLOT_ORDER: EquipSlot[] = [
  'helmet', 'chestplate', 'leggings', 'boots', 'weapon', 'necklace', 'ring',
]

const EPIC_PIECE_GOLD = 2_000
const EPIC_PIECE_GEMS = 15
const LEGENDARY_PIECE_GOLD = 5_500
const LEGENDARY_PIECE_GEMS = 35

/** Old full-set scroll IDs → per-piece scroll IDs (save migration). */
const LEGACY_SCROLL_EXPANSION: Record<string, string[]> = {
  scroll_epic_storm: EPIC_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('storm_breaker_'))
    .map((r) => `scroll_${r.id}`),
  scroll_epic_crystal: EPIC_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('crystal_guard_'))
    .map((r) => `scroll_${r.id}`),
  scroll_epic_beast: EPIC_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('beast_master_'))
    .map((r) => `scroll_${r.id}`),
  scroll_legendary_shadow: LEGENDARY_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('shadow_ascension_'))
    .map((r) => `scroll_${r.id}`),
  scroll_legendary_solo: LEGENDARY_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('solo_leveling_'))
    .map((r) => `scroll_${r.id}`),
  scroll_legendary_punch: LEGENDARY_SET_CRAFT_RECIPES
    .filter((r) => r.resultItemId.startsWith('one_punch_'))
    .map((r) => `scroll_${r.id}`),
}

function recipeToScroll(recipe: CraftRecipe): SetScrollProduct | null {
  const rarity = recipe.setCraftRarity
  if (rarity !== 'epic' && rarity !== 'legendary') return null
  const item = ALL_ITEMS[recipe.resultItemId]
  return {
    scrollId: `scroll_${recipe.id}`,
    recipeId: recipe.id,
    nameRu: `Свиток: ${recipe.name}`,
    descriptionRu: `Открывает рецепт «${recipe.name}» в Кузнице.`,
    goldPrice: rarity === 'legendary' ? LEGENDARY_PIECE_GOLD : EPIC_PIECE_GOLD,
    gemsPrice: rarity === 'legendary' ? LEGENDARY_PIECE_GEMS : EPIC_PIECE_GEMS,
    rarity,
    setId: item?.setId ?? 'unknown',
    setName: item?.setName ?? 'Сет',
    slot: (item?.slot ?? 'weapon') as EquipSlot,
  }
}

function sortScrolls(products: SetScrollProduct[]): SetScrollProduct[] {
  return [...products].sort((a, b) => {
    const rarityOrder = a.rarity === b.rarity ? 0 : a.rarity === 'epic' ? -1 : 1
    if (rarityOrder !== 0) return rarityOrder
    const setCmp = a.setName.localeCompare(b.setName, 'ru')
    if (setCmp !== 0) return setCmp
    return SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
  })
}

export const SET_SCROLL_PRODUCTS: SetScrollProduct[] = sortScrolls([
  ...EPIC_SET_CRAFT_RECIPES.map(recipeToScroll).filter((s): s is SetScrollProduct => !!s),
  ...LEGENDARY_SET_CRAFT_RECIPES.map(recipeToScroll).filter((s): s is SetScrollProduct => !!s),
])

export const SCROLL_SHOP_ITEMS: ShopItem[] = SET_SCROLL_PRODUCTS.map((s) => ({
  id: `shop_${s.scrollId}`,
  name: s.nameRu,
  nameRu: s.nameRu,
  description: s.descriptionRu,
  descriptionRu: s.descriptionRu,
  type: 'scroll' as const,
  goldPrice: s.goldPrice,
  gemsPrice: s.gemsPrice,
  icon: '📜',
  scrollId: s.scrollId,
}))

export function migrateUnlockedSetScrolls(unlockedScrolls: string[] | undefined): string[] {
  if (!unlockedScrolls?.length) return []
  const out = new Set<string>()
  for (const id of unlockedScrolls) {
    const expanded = LEGACY_SCROLL_EXPANSION[id]
    if (expanded) expanded.forEach((s) => out.add(s))
    else out.add(id)
  }
  return [...out]
}

export function getUnlockedScrollRecipeIds(unlockedScrolls: string[] | undefined): string[] {
  const migrated = migrateUnlockedSetScrolls(unlockedScrolls)
  if (!migrated.length) return []
  const ids: string[] = []
  for (const scroll of SET_SCROLL_PRODUCTS) {
    if (migrated.includes(scroll.scrollId)) ids.push(scroll.recipeId)
  }
  return ids
}

export function getScrollSetFilters(): { id: string; name: string; rarity: 'epic' | 'legendary' }[] {
  const seen = new Set<string>()
  const result: { id: string; name: string; rarity: 'epic' | 'legendary' }[] = []
  for (const s of SET_SCROLL_PRODUCTS) {
    if (!seen.has(s.setId)) {
      seen.add(s.setId)
      result.push({ id: s.setId, name: s.setName, rarity: s.rarity })
    }
  }
  return result
}
