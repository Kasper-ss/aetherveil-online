import type { AlchemyRecipe } from '@/data/alchemyPotions'
import type { Player, ResourceId } from '@/types/game'
import { getProfessionSkillLevel, getProfessionMythicSkillLevel } from '@/lib/professionBonuses'

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

export function getAlchemyGoldDiscount(player: Player): number {
  return Math.min(
    0.45,
    getProfessionSkillLevel(player, 'alchemist', 'al_9') * 0.15
      + getProfessionMythicSkillLevel(player, 'alchemist', 'al_m4') * 0.08,
  )
}

export function getAlchemyBrewTimeMult(player: Player): number {
  return Math.max(0.5, 1 - getProfessionSkillLevel(player, 'alchemist', 'al_2') * 0.10)
}

export function applyAlchemyRecipeCost(player: Player, recipe: AlchemyRecipe): AlchemyRecipe {
  const disc = getAlchemyGoldDiscount(player)
  if (disc <= 0) return recipe
  return {
    ...recipe,
    goldCost: Math.max(1, Math.ceil(recipe.goldCost * (1 - disc))),
    resources: scaleResources(recipe.resources, 1 - disc * 0.5),
  }
}

export function getAlchemyBatchCount(player: Player): number {
  return getProfessionSkillLevel(player, 'alchemist', 'al_7') >= 1 ? 2 : 1
}

export function rollAlchemyDoublePotion(player: Player): boolean {
  const chance = Math.min(0.4, getProfessionMythicSkillLevel(player, 'alchemist', 'al_m5') * 0.05)
  return chance > 0 && Math.random() < chance
}
