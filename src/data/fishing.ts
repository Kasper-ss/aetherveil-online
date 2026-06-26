import type { ItemRarity, ResourceId } from '@/types/game'

export interface FishEntry {
  id: ResourceId
  nameRu: string
  rarity: ItemRarity
  weight: number
}

export const FISH_TABLE: FishEntry[] = [
  { id: 'fish_minnow', nameRu: 'Пескарь', rarity: 'common', weight: 18 },
  { id: 'fish_bream', nameRu: 'Лещ', rarity: 'common', weight: 14 },
  { id: 'fish_carp', nameRu: 'Карп', rarity: 'common', weight: 12 },
  { id: 'fish_perch', nameRu: 'Окунь', rarity: 'common', weight: 11 },
  { id: 'fish_trout', nameRu: 'Форель', rarity: 'rare', weight: 10 },
  { id: 'fish_salmon', nameRu: 'Лосось', rarity: 'rare', weight: 8 },
  { id: 'fish_pike', nameRu: 'Щука', rarity: 'rare', weight: 7 },
  { id: 'fish_tuna', nameRu: 'Тунец', rarity: 'rare', weight: 6 },
  { id: 'fish_cod', nameRu: 'Треска', rarity: 'rare', weight: 5 },
  { id: 'fish_eel', nameRu: 'Угорь', rarity: 'epic', weight: 4 },
  { id: 'fish_crab', nameRu: 'Краб', rarity: 'epic', weight: 4 },
  { id: 'fish_lobster', nameRu: 'Омар', rarity: 'epic', weight: 3 },
  { id: 'fish_squid', nameRu: 'Кальмар', rarity: 'epic', weight: 3 },
  { id: 'fish_swordfish', nameRu: 'Рыба-меч', rarity: 'legendary', weight: 2 },
  { id: 'fish_aether_koi', nameRu: 'Эфирный карп', rarity: 'legendary', weight: 1 },
]

const JUNK_WEIGHT = 12

export const FISHING_ENERGY_COST = 16

export function rollFishCatch(junkReduction = 0): { fish: FishEntry | null; junk: boolean } {
  const fishWeight = FISH_TABLE.reduce((s, f) => s + f.weight, 0)
  const junkWeight = Math.max(4, JUNK_WEIGHT * (1 - junkReduction))
  const total = fishWeight + junkWeight
  let roll = Math.random() * total

  if (roll > fishWeight) return { fish: null, junk: true }

  for (const fish of FISH_TABLE) {
    roll -= fish.weight
    if (roll <= 0) return { fish, junk: false }
  }
  return { fish: FISH_TABLE[0], junk: false }
}

export const RARITY_FISH_COLORS: Record<ItemRarity, string> = {
  common: 'text-slate-300',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-amber-400',
  mythic: 'text-fuchsia-400',
}
