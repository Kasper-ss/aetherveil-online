import type { Player, ResourceId, CraftRecipe } from '@/types/game'
import { RESOURCES } from '@/data/classes'
import { getProfessionExp, getProfessionRank } from '@/lib/professionProgress'

export interface MissingCost {
  key: string
  label: string
  icon: string
  have: number
  need: number
}

export function getMissingCosts(
  player: Player,
  goldCost: number,
  resources: Partial<Record<ResourceId, number>>,
  recipe?: CraftRecipe,
): MissingCost[] {
  const missing: MissingCost[] = []
  if (player.gold < goldCost) {
    missing.push({ key: 'gold', label: 'Золото', icon: '🪙', have: player.gold, need: goldCost })
  }
  for (const [rid, need] of Object.entries(resources)) {
    if (!need || need <= 0) continue
    const have = player.resources[rid as ResourceId] ?? 0
    if (have < need) {
      const res = RESOURCES[rid as ResourceId]
      missing.push({ key: rid, label: res.nameRu, icon: res.icon, have, need })
    }
  }
  if (recipe?.requiredProfession && recipe.requiredProfessionLevel) {
    const rank = getProfessionRank(getProfessionExp(player, recipe.requiredProfession))
    if (rank < recipe.requiredProfessionLevel) {
      missing.push({
        key: 'profLevel',
        label: 'Ранг профессии',
        icon: '📈',
        have: rank,
        need: recipe.requiredProfessionLevel,
      })
    }
  }
  return missing
}
