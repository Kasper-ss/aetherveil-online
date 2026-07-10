import type { CraftRecipe, PlayerClass, ResourceId } from '@/types/game'
import { ALL_ITEMS } from '@/data/items'
import { getLegacyClassBucket, normalizeClassId } from '@/lib/classCompat'

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

function classAffinity(classId: PlayerClass, recipe: CraftRecipe): number {
  if (recipe.setCraftRarity === 'lucky') return 0
  const bucket = getLegacyClassBucket(normalizeClassId(classId))
  if (!bucket) return 0
  const itemId = recipe.resultItemId
  const slot = ALL_ITEMS[itemId]?.slot
  switch (bucket) {
    case 'warrior':
    case 'knight':
      if (slot === 'weapon' || slot === 'chestplate' || slot === 'helmet') return 0.12
      break
    case 'archer':
    case 'assassin':
      if (slot === 'weapon' || slot === 'boots' || slot === 'leggings') return 0.12
      break
    case 'mage':
    case 'summoner':
      if (slot === 'weapon' || slot === 'necklace' || slot === 'ring') return 0.12
      if (recipe.requiredProfession === 'alchemist') return 0.1
      break
  }
  if (recipe.requiredProfession === 'blacksmith' && (bucket === 'warrior' || bucket === 'knight')) return 0.08
  return 0
}

export function applyClassCraftModifier(recipe: CraftRecipe, classId?: PlayerClass): CraftRecipe {
  if (!classId) return recipe
  const discount = classAffinity(classId, recipe)
  if (discount <= 0) return recipe
  const mult = 1 - discount
  return {
    ...recipe,
    goldCost: Math.max(1, Math.ceil(recipe.goldCost * mult)),
    resources: scaleResources(recipe.resources, mult),
  }
}
