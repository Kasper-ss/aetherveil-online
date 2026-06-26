import type { ShopItem } from '@/types/game'
import { EPIC_SET_CRAFT_RECIPES, LEGENDARY_SET_CRAFT_RECIPES } from '@/data/setCraftRecipes'

export interface SetScrollProduct {
  scrollId: string
  nameRu: string
  descriptionRu: string
  recipeIds: string[]
  goldPrice: number
  gemsPrice?: number
  icon: string
  rarity: 'epic' | 'legendary'
}

function recipesByPrefix(prefix: string, pool: typeof EPIC_SET_CRAFT_RECIPES): string[] {
  return pool.filter((r) => r.resultItemId.startsWith(prefix)).map((r) => r.id)
}

export const SET_SCROLL_PRODUCTS: SetScrollProduct[] = [
  {
    scrollId: 'scroll_epic_storm',
    nameRu: 'Свиток «Громобой»',
    descriptionRu: 'Открывает эпические рецепты сета Громобой в Кузнице.',
    recipeIds: recipesByPrefix('storm_breaker_', EPIC_SET_CRAFT_RECIPES),
    goldPrice: 12_000,
    gemsPrice: 80,
    icon: '📜',
    rarity: 'epic',
  },
  {
    scrollId: 'scroll_epic_crystal',
    nameRu: 'Свиток «Кристальный Страж»',
    descriptionRu: 'Открывает эпические рецепты сета Кристальный Страж.',
    recipeIds: recipesByPrefix('crystal_guard_', EPIC_SET_CRAFT_RECIPES),
    goldPrice: 12_000,
    gemsPrice: 80,
    icon: '📜',
    rarity: 'epic',
  },
  {
    scrollId: 'scroll_epic_beast',
    nameRu: 'Свиток «Повелитель Зверей»',
    descriptionRu: 'Открывает эпические рецепты сета Повелитель Зверей.',
    recipeIds: recipesByPrefix('beast_master_', EPIC_SET_CRAFT_RECIPES),
    goldPrice: 12_000,
    gemsPrice: 80,
    icon: '📜',
    rarity: 'epic',
  },
  {
    scrollId: 'scroll_legendary_shadow',
    nameRu: 'Свиток «Восхождение в Тени»',
    descriptionRu: 'Открывает легендарные рецепты сета Восхождение в Тени.',
    recipeIds: recipesByPrefix('shadow_ascension_', LEGENDARY_SET_CRAFT_RECIPES),
    goldPrice: 35_000,
    gemsPrice: 200,
    icon: '📜',
    rarity: 'legendary',
  },
  {
    scrollId: 'scroll_legendary_solo',
    nameRu: 'Свиток «Одиночка»',
    descriptionRu: 'Открывает легендарные рецепты сета Поднятие уровня в одиночку.',
    recipeIds: recipesByPrefix('solo_leveling_', LEGENDARY_SET_CRAFT_RECIPES),
    goldPrice: 35_000,
    gemsPrice: 200,
    icon: '📜',
    rarity: 'legendary',
  },
  {
    scrollId: 'scroll_legendary_punch',
    nameRu: 'Свиток «Ванпанчмен»',
    descriptionRu: 'Открывает легендарные рецепты сета Ванпанчмен.',
    recipeIds: recipesByPrefix('one_punch_', LEGENDARY_SET_CRAFT_RECIPES),
    goldPrice: 35_000,
    gemsPrice: 200,
    icon: '📜',
    rarity: 'legendary',
  },
]

export const SCROLL_SHOP_ITEMS: ShopItem[] = SET_SCROLL_PRODUCTS.map((s) => ({
  id: `shop_${s.scrollId}`,
  name: s.nameRu,
  nameRu: s.nameRu,
  description: s.descriptionRu,
  descriptionRu: s.descriptionRu,
  type: 'scroll' as const,
  goldPrice: s.goldPrice,
  gemsPrice: s.gemsPrice,
  icon: s.icon,
  scrollId: s.scrollId,
}))

export function getUnlockedScrollRecipeIds(unlockedScrolls: string[] | undefined): string[] {
  if (!unlockedScrolls?.length) return []
  const ids: string[] = []
  for (const scroll of SET_SCROLL_PRODUCTS) {
    if (unlockedScrolls.includes(scroll.scrollId)) ids.push(...scroll.recipeIds)
  }
  return ids
}
