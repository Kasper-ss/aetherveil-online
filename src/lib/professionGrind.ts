import type { ResourceId } from '@/types/game'
import { getGrindLocationXpToUnlock } from '@/lib/professionProgress'

export interface GrindDrop {
  resource: ResourceId
  weight: number
  amount: [number, number]
}

export interface GrindLevel {
  level: number
  nameRu: string
  energyCost: number
  xpPerAction: number
  xpToUnlock: number
  drops: GrindDrop[]
  doubleChance: number
  specialChance: number
  specialLabelRu: string
}

export function getGrindLevelData(levels: GrindLevel[], level: number): GrindLevel {
  return levels.find((l) => l.level === level) ?? levels[0]
}

export function getUnlockedGrindLevel(levels: GrindLevel[], xp: number): number {
  let unlocked = 1
  for (const l of levels) {
    if (xp >= getGrindLocationXpToUnlock(l.level)) unlocked = l.level
  }
  return unlocked
}

function rollAmount(range: [number, number]): number {
  return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1))
}

export function rollGrindRewards(level: GrindLevel): {
  resources: Partial<Record<ResourceId, number>>
  isDouble: boolean
  isSpecial: boolean
} {
  const totalWeight = level.drops.reduce((s, d) => s + d.weight, 0)
  let roll = Math.random() * totalWeight
  let pick = level.drops[0]
  for (const d of level.drops) {
    roll -= d.weight
    if (roll <= 0) { pick = d; break }
  }

  const isSpecial = Math.random() < level.specialChance
  const isDouble = isSpecial || Math.random() < level.doubleChance
  let amount = rollAmount(pick.amount)
  if (isSpecial) amount *= 3
  else if (isDouble) amount *= 2

  const resources: Partial<Record<ResourceId, number>> = { [pick.resource]: amount }
  if (isSpecial) {
    const bonus = level.drops[Math.floor(Math.random() * level.drops.length)]
    resources[bonus.resource] = (resources[bonus.resource] ?? 0) + rollAmount(bonus.amount)
  }

  return { resources, isDouble, isSpecial }
}
