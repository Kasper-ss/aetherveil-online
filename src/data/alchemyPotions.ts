import type { ItemRarity, ResourceId } from '@/types/game'
import type { Player } from '@/types/game'
import { getProfessionExp, getProfessionRank } from '@/lib/professionProgress'
import { isProfessionActive } from '@/lib/professionProgress'

export interface AlchemyRecipe {
  id: string
  resultItemId: string
  nameRu: string
  descriptionRu: string
  rarity: ItemRarity
  resources: Partial<Record<ResourceId, number>>
  goldCost: number
  minAlchemistRank?: number
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
    descriptionRu: 'Восстанавливает 80% HP. Нужен активный Алхимик, ранг 12+.',
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
]

export function canBrewAlchemyRecipe(player: Player, recipe: AlchemyRecipe): boolean {
  if (recipe.rarity === 'common' || recipe.rarity === 'rare') return true
  if (!isProfessionActive(player, 'alchemist')) return false
  const rank = getProfessionRank(getProfessionExp(player, 'alchemist'))
  return rank >= (recipe.minAlchemistRank ?? 1)
}

export function getAlchemyRecipesForPlayer(player: Player): AlchemyRecipe[] {
  return ALCHEMY_RECIPES.filter((r) => canBrewAlchemyRecipe(player, r))
}

export function findAlchemyRecipe(id: string): AlchemyRecipe | undefined {
  return ALCHEMY_RECIPES.find((r) => r.id === id)
}
