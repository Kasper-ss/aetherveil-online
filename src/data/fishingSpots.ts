import type { ResourceId } from '@/types/game'
import { FISH_TABLE, type FishEntry } from '@/data/fishing'
import { getGrindLocationXpToUnlock } from '@/lib/professionProgress'

export interface FishingSpot {
  level: number
  nameRu: string
  energyCost: number
  xpPerCast: number
  xpToUnlock: number
  junkWeight: number
  trophyChance: number
  rareMult: number
  fishBoost: Partial<Record<ResourceId, number>>
}

export const FISHING_SPOTS: FishingSpot[] = [
  {
    level: 1,
    nameRu: 'Прибрежная лагуна',
    energyCost: 14,
    xpPerCast: 3,
    xpToUnlock: 0,
    junkWeight: 14,
    trophyChance: 0.02,
    rareMult: 1,
    fishBoost: {},
  },
  {
    level: 2,
    nameRu: 'Речные пороги',
    energyCost: 16,
    xpPerCast: 4,
    xpToUnlock: 240,
    junkWeight: 12,
    trophyChance: 0.03,
    rareMult: 1.15,
    fishBoost: { fish_trout: 1.5, fish_salmon: 1.3 },
  },
  {
    level: 3,
    nameRu: 'Глубокое озеро',
    energyCost: 18,
    xpPerCast: 5,
    xpToUnlock: 600,
    junkWeight: 10,
    trophyChance: 0.04,
    rareMult: 1.3,
    fishBoost: { fish_eel: 1.4, fish_pike: 1.3, fish_tuna: 1.2 },
  },
  {
    level: 4,
    nameRu: 'Морские рифы',
    energyCost: 22,
    xpPerCast: 6,
    xpToUnlock: 1300,
    junkWeight: 8,
    trophyChance: 0.05,
    rareMult: 1.5,
    fishBoost: { fish_crab: 1.5, fish_lobster: 1.4, fish_squid: 1.3 },
  },
  {
    level: 5,
    nameRu: 'Эфирные глубины',
    energyCost: 26,
    xpPerCast: 7,
    xpToUnlock: 2600,
    junkWeight: 6,
    trophyChance: 0.07,
    rareMult: 1.8,
    fishBoost: { fish_swordfish: 2, fish_aether_koi: 2.5 },
  },
]

export function getFishingSpotData(level: number): FishingSpot {
  return FISHING_SPOTS.find((s) => s.level === level) ?? FISHING_SPOTS[0]
}

export function getUnlockedFishingSpot(xp: number): number {
  let unlocked = 1
  for (const s of FISHING_SPOTS) {
    if (xp >= getGrindLocationXpToUnlock(s.level)) unlocked = s.level
  }
  return unlocked
}


export function rollSpotFishCatch(
  spot: FishingSpot,
  junkReduction = 0,
): { fish: FishEntry | null; junk: boolean; isTrophy: boolean } {
  const isTrophy = Math.random() < spot.trophyChance

  const weightedFish = FISH_TABLE.map((f) => {
    const boost = spot.fishBoost[f.id] ?? 1
    const rarityBoost = f.rarity !== 'common' ? spot.rareMult : 1
    const trophyBoost = isTrophy && (f.rarity === 'epic' || f.rarity === 'legendary') ? 3 : 1
    return { ...f, weight: f.weight * boost * rarityBoost * trophyBoost }
  })

  const fishWeight = weightedFish.reduce((s, f) => s + f.weight, 0)
  const junkWeight = Math.max(3, spot.junkWeight * (1 - junkReduction))
  const total = fishWeight + junkWeight
  let roll = Math.random() * total

  if (roll > fishWeight) return { fish: null, junk: true, isTrophy: false }

  for (const fish of weightedFish) {
    roll -= fish.weight
    if (roll <= 0) return { fish, junk: false, isTrophy }
  }
  return { fish: weightedFish[0], junk: false, isTrophy }
}
