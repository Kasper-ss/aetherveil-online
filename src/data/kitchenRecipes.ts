import type { EffectStat, ItemRarity, PlayerClass, ResourceId } from '@/types/game'

export interface KitchenRecipe {
  id: string
  nameRu: string
  descriptionRu: string
  icon: string
  rarity: ItemRarity
  resultFoodId: string
  resources: Partial<Record<ResourceId, number>>
  goldCost: number
  buffStat: EffectStat
  buffMult: number
  buffDurationMs: number
  buffLabel: string
  classBonus?: PlayerClass
  classDiscount?: number
}

export const KITCHEN_RECIPES: KitchenRecipe[] = [
  {
    id: 'cook_roast_meat',
    nameRu: 'Жареное мясо',
    descriptionRu: '+10% ATK на 20 мин.',
    icon: '🍖',
    rarity: 'common',
    resultFoodId: 'food_roast_meat',
    resources: { meat: 4 },
    goldCost: 40,
    buffStat: 'atk',
    buffMult: 1.1,
    buffDurationMs: 20 * 60_000,
    buffLabel: 'Жареное мясо',
    classBonus: 'warrior',
    classDiscount: 0.15,
  },
  {
    id: 'cook_herb_soup',
    nameRu: 'Травяной суп',
    descriptionRu: '+15% HP на 25 мин.',
    icon: '🍲',
    rarity: 'common',
    resultFoodId: 'food_herb_soup',
    resources: { herb: 6, meat: 2 },
    goldCost: 55,
    buffStat: 'hp',
    buffMult: 1.15,
    buffDurationMs: 25 * 60_000,
    buffLabel: 'Травяной суп',
    classBonus: 'paladin',
    classDiscount: 0.12,
  },
  {
    id: 'cook_fish_grill',
    nameRu: 'Рыбный гриль',
    descriptionRu: '+12% скорость на 20 мин.',
    icon: '🐟',
    rarity: 'rare',
    resultFoodId: 'food_fish_grill',
    resources: { fish_trout: 2, fish_perch: 2, rare_spice: 1 },
    goldCost: 90,
    buffStat: 'speed',
    buffMult: 1.12,
    buffDurationMs: 20 * 60_000,
    buffLabel: 'Рыбный гриль',
    classBonus: 'hunter',
    classDiscount: 0.12,
  },
  {
    id: 'cook_sea_feast',
    nameRu: 'Морской пир',
    descriptionRu: '+15% CRIT на 30 мин.',
    icon: '🦞',
    rarity: 'epic',
    resultFoodId: 'food_sea_feast',
    resources: { fish_lobster: 1, fish_crab: 2, fish_salmon: 2, rare_spice: 2 },
    goldCost: 180,
    buffStat: 'crit',
    buffMult: 1.15,
    buffDurationMs: 30 * 60_000,
    buffLabel: 'Морской пир',
    classBonus: 'rogue',
    classDiscount: 0.1,
  },
  {
    id: 'cook_mana_brew',
    nameRu: 'Мана-отвар',
    descriptionRu: '+12% ATK и DEF на 25 мин.',
    icon: '🧪',
    rarity: 'rare',
    resultFoodId: 'food_mana_brew',
    resources: { herb: 8, mana_crystal: 2, sulfur: 1 },
    goldCost: 120,
    buffStat: 'all',
    buffMult: 1.12,
    buffDurationMs: 25 * 60_000,
    buffLabel: 'Мана-отвар',
    classBonus: 'mage',
    classDiscount: 0.15,
  },
  {
    id: 'cook_aether_sushi',
    nameRu: 'Эфирное суши',
    descriptionRu: '+18% ко всем статам на 40 мин.',
    icon: '✨',
    rarity: 'legendary',
    resultFoodId: 'food_aether_sushi',
    resources: { fish_aether_koi: 1, fish_swordfish: 1, abyssal_pearl: 1, rare_spice: 3 },
    goldCost: 450,
    buffStat: 'all',
    buffMult: 1.18,
    buffDurationMs: 40 * 60_000,
    buffLabel: 'Эфирное суши',
    classBonus: 'priest',
    classDiscount: 0.1,
  },
]

export function getKitchenRecipesForPlayer(classId?: PlayerClass): KitchenRecipe[] {
  return KITCHEN_RECIPES.map((r) => {
    if (!classId || r.classBonus !== classId || !r.classDiscount) return r
    const mult = 1 - r.classDiscount
    const scaled: Partial<Record<ResourceId, number>> = {}
    for (const [k, v] of Object.entries(r.resources)) {
      if (v) scaled[k as ResourceId] = Math.max(1, Math.ceil(v * mult))
    }
    return { ...r, goldCost: Math.max(1, Math.ceil(r.goldCost * mult)), resources: scaled }
  })
}

export function findKitchenRecipe(id: string): KitchenRecipe | undefined {
  return KITCHEN_RECIPES.find((r) => r.id === id)
}

export const FOOD_BUFF_MAP: Record<string, { stat: EffectStat; mult: number; durationMs: number; label: string }> =
  Object.fromEntries(
    KITCHEN_RECIPES.map((r) => [
      r.resultFoodId,
      { stat: r.buffStat, mult: r.buffMult, durationMs: r.buffDurationMs, label: r.buffLabel },
    ]),
  )
