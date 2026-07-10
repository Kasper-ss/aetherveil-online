import type { ItemRarity, ResourceId } from '@/types/game'
import type { Player } from '@/types/game'
import { getProfessionExp, getProfessionRank } from '@/lib/professionProgress'
import { isHerbalismActive } from '@/lib/professionBonuses'

export interface AlchemyRecipe {
  id: string
  resultItemId: string
  nameRu: string
  descriptionRu: string
  rarity: ItemRarity
  resources: Partial<Record<ResourceId, number>>
  goldCost: number
  minAlchemistRank?: number
  /** Только для активного травничества (алхимик в основных). */
  herbalismOnly?: boolean
  /** Мс варки; HP/стамина зелья — мгновенно. */
  brewTimeMs?: number
}

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
  {
    id: 'brew_hp_basic',
    resultItemId: 'hp_potion',
    nameRu: 'Зелье HP',
    descriptionRu: 'Восстанавливает 50% HP. Доступно всем.',
    rarity: 'common',
    resources: { herb_mint: 4 },
    goldCost: 40,
  },
  {
    id: 'brew_energy',
    resultItemId: 'energy_drink',
    nameRu: 'Энергетик',
    descriptionRu: 'Восстанавливает 30 энергии. Доступно всем.',
    rarity: 'common',
    resources: { herb_mint: 3 },
    goldCost: 35,
  },
  {
    id: 'brew_hp_rare',
    resultItemId: 'hp_potion_rare',
    nameRu: 'Сильное зелье HP',
    descriptionRu: 'Восстанавливает 65% HP. Доступно всем.',
    rarity: 'rare',
    resources: { herb: 3, herb_lotus: 2 },
    goldCost: 90,
  },
  {
    id: 'brew_energy_rare',
    resultItemId: 'energy_drink_rare',
    nameRu: 'Мощный энергетик',
    descriptionRu: 'Восстанавливает 50 энергии. Доступно всем.',
    rarity: 'rare',
    resources: { herb_lotus: 2, mana_crystal: 1 },
    goldCost: 100,
  },
  {
    id: 'brew_hp_epic',
    resultItemId: 'hp_potion_epic',
    nameRu: 'Эпическое зелье HP',
    descriptionRu: 'Восстанавливает 80% HP. Нужен ранг Алхимика 12+.',
    rarity: 'epic',
    resources: { herb_lotus: 3, herb_phoenix: 2, mana_crystal: 2 },
    goldCost: 220,
    minAlchemistRank: 12,
  },
  {
    id: 'brew_hp_legend',
    resultItemId: 'hp_potion_legendary',
    nameRu: 'Легендарное зелье жизни',
    descriptionRu: 'Полное восстановление HP. Алхимик ранг 22+.',
    rarity: 'legendary',
    resources: { herb_void: 2, herb_phoenix: 3, aether_dust: 2 },
    goldCost: 600,
    minAlchemistRank: 22,
  },
  {
    id: 'brew_herb_rare_elixir',
    resultItemId: 'hp_potion_rare',
    nameRu: 'Редкий эликсир травника',
    descriptionRu: '+15% ATK на 30 мин. Только при активном Травничестве.',
    rarity: 'rare',
    resources: { herb_lotus: 4, herb_phoenix: 1 },
    goldCost: 350,
    minAlchemistRank: 8,
    herbalismOnly: true,
    brewTimeMs: 5 * 60_000,
  },
  {
    id: 'brew_herb_legend_nectar',
    resultItemId: 'hp_potion_legendary',
    nameRu: 'Легендарный нектар земли',
    descriptionRu: 'Мощный бафф: +25% HP и +10% DEF на 1 час. Только травники.',
    rarity: 'legendary',
    resources: { herb_void: 3, herb_phoenix: 4, aether_dust: 3 },
    goldCost: 1200,
    minAlchemistRank: 18,
    herbalismOnly: true,
    brewTimeMs: 15 * 60_000,
  },
  {
    id: 'brew_flask_atk',
    resultItemId: 'energy_drink_rare',
    nameRu: 'Фласка ярости',
    descriptionRu: '+20% ATK на 20 мин.',
    rarity: 'epic',
    resources: { herb: 5, sulfur: 2, mana_crystal: 2 },
    goldCost: 480,
    minAlchemistRank: 10,
    brewTimeMs: 8 * 60_000,
  },
  {
    id: 'brew_flask_def',
    resultItemId: 'energy_drink',
    nameRu: 'Фласка стойкости',
    descriptionRu: '+15% DEF на 20 мин.',
    rarity: 'epic',
    resources: { herb_lotus: 4, rare_spice: 2 },
    goldCost: 420,
    minAlchemistRank: 10,
    brewTimeMs: 8 * 60_000,
  },
]

export function canBrewAlchemyRecipe(player: Player, recipe: AlchemyRecipe): boolean {
  if (recipe.herbalismOnly && !isHerbalismActive(player)) return false
  if (recipe.rarity === 'common' || recipe.rarity === 'rare') {
    if (recipe.minAlchemistRank) {
      const rank = getProfessionRank(getProfessionExp(player, 'alchemist'))
      return rank >= recipe.minAlchemistRank
    }
    return true
  }
  const rank = getProfessionRank(getProfessionExp(player, 'alchemist'))
  return rank >= (recipe.minAlchemistRank ?? 1)
}

export function getAlchemyRecipesForPlayer(player: Player): AlchemyRecipe[] {
  return ALCHEMY_RECIPES.filter((r) => {
    if (r.herbalismOnly && !isHerbalismActive(player)) return false
    return canBrewAlchemyRecipe(player, r) || !r.herbalismOnly
  })
}

export function getVisibleHerbalismRecipes(player: Player): AlchemyRecipe[] {
  if (!isHerbalismActive(player)) return []
  return ALCHEMY_RECIPES.filter((r) => r.herbalismOnly)
}

export function findAlchemyRecipe(id: string): AlchemyRecipe | undefined {
  return ALCHEMY_RECIPES.find((r) => r.id === id)
}

export function needsBrewTimer(recipe: AlchemyRecipe): boolean {
  return (recipe.brewTimeMs ?? 0) > 0
}

export function getReadyBrews(player: Player): import('@/types/game').ActiveBrew[] {
  const now = Date.now()
  return (player.activeBrews ?? []).filter((b) => new Date(b.readyAt).getTime() <= now)
}

export function getPendingBrews(player: Player): import('@/types/game').ActiveBrew[] {
  const now = Date.now()
  return (player.activeBrews ?? []).filter((b) => new Date(b.readyAt).getTime() > now)
}
